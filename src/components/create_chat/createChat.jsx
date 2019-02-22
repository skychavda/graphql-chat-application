import React from "react";
import { Mutation, graphql, compose, withApollo } from "react-apollo";
import { gql } from "apollo-boost";
import { Picker, Parser } from 'mr-emoji';
import './createchat.css';
import ScrollToBottom from 'react-scroll-to-bottom';

const GET_CHAT = gql`
    query GetChat($sender:String!,$receiver:String!){
        chats(senderName:$sender,receiverName:$receiver){
            message
            chatUserId
            chatConversationId
        }
    }
`;

const MESSAGE_DELETE = gql`
    mutation MessageDelete($chatConversationId:ID!,$senderName:String!,$receiverName:String!){
        messageDelete(chatConversationId:$chatConversationId,senderName:$senderName,receiverName:$receiverName){
            chatConversationId
            message
            chatUserId
        }
    }
`;

const MESSAGE_UPDATE = gql`
mutation MessageUpdate($chatConversationId:ID!,$senderName:String!,$receiverName:String!,$message:String!,$messageStatus:State!){
  messageUpdate(chatConversationId:$chatConversationId, senderName:$senderName, receiverName:$receiverName, message:$message, messageStatus:$messageStatus){
    chatConversationId
    chatUserId
    message
  }
}
`;

const MESSAGE_POST = gql`
    mutation MessagePost($messages:String!,$senderName:String!,$receiverName:String!){
        messagePost(message:$messages,senderName:$senderName,receiverName:$receiverName,messageStatus:SEND){
            message
        }
    }
`;

const MESSAGE_SUBSCRIPTION = gql`
    subscription MessageSubscription($chat_user_id:ID!){
        postMessage(chatUserId: $chat_user_id){
            message
            chatUserId
            chatConversationId
        }
    }
`;

const UPDATE_MESSAGE_SUBSCRIPTION = gql`
subscription UpdateMessageSubscription($chat_user_id:ID!){
    updateMessage(chatUserId:$chat_user_id){
      message
      chatUserId
      chatConversationId
    }
  }
`;

const DELETE_MESSAGE_SUBSCRIPION = gql`
    subscription DeleteMessageSubscription($chat_user_id:ID!){
        deleteMessage(chatUserId:$chat_user_id){
            chatUserId
            message
            chatConversationId
        }
    }
`;

const EmojiTable = (onClickEmoji) => {
    return (<div className="emoji-table">
        <Picker perLine='7' showPreview='false' onClick={onClickEmoji.handleOnClick} />
    </div>);
}

class CreateChat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: 'none',
            emojiShown: false,
            text: '',
            userId: '',
            messages: [],
            chatConversationId: ''
        };
        this.sendMessage = this.sendMessage.bind(this);
        this.handleTextChange = this.handleTextChange.bind(this);
        this.fetchMessageFromQuery = this.fetchMessageFromQuery.bind(this);
        this.addNewMessageSubscription = this.addNewMessageSubscription.bind(this);
    }

    addNewMessageSubscription = 
        //subscription for add new message  
        this.props.data.subscribeToMore({
            document: MESSAGE_SUBSCRIPTION,
            variables: { chat_user_id: this.props.userId },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData) return prev;
                const message = this.state.messages;
                const newMessage = subscriptionData.data.postMessage;
                
               // console.log('Line ---- 108',this.props.userId, newMessage);
                message.push(newMessage);
                this.setState({ message }, function(){
                    //console.log('Line ---- 111',this.state.messages);
                })
                // return message.push(newMessage);
            }
        })

    componentDidMount() {

        this.addNewMessageSubscription;

        //subscription for delete message
        this.props.data.subscribeToMore({
            document: DELETE_MESSAGE_SUBSCRIPION,
            variables: { chat_user_id: this.props.userId },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData) return prev;
                const messages = this.state.messages;
                const newMessage = subscriptionData.data.deleteMessage;
                const deleteIndex = messages.findIndex(message => message.chatConversationId === newMessage.chatConversationId)
                if (deleteIndex > -1) {
                    messages.splice(deleteIndex,1);
                    this.setState({ messages });
                }
            }
        })

        //subscription for update message
        this.props.data.subscribeToMore({
            document: UPDATE_MESSAGE_SUBSCRIPTION,
            variables: { chat_user_id: this.props.userId },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData) return prev;
                const newMessage = subscriptionData.data.updateMessage;
                const messages = this.state.messages.slice(0);
                const updateIndex = messages.findIndex(message => message.chatConversationId === newMessage.chatConversationId)
                if (updateIndex > -1) {
                    messages[updateIndex] = newMessage;
                    console.log('Line ---- 140',messages);
                    this.setState({ messages });
                }
            }
        })
        this.fetchMessageFromQuery();
    }

    componentDidUpdate(prev) {
        // this.addNewMessageSubscription.unsubscribe();
        if (this.props.receiverName !== prev.receiverName) {
            this.fetchMessageFromQuery();
            this.addNewMessageSubscription();
        }
    }

    fetchMessageFromQuery = async () => {
        const { client } = this.props;
        this.props.client.cache.reset();
        const result = await client.query({
            query: GET_CHAT,
            variables: {
                sender: this.props.senderName, receiver: this.props.receiverName
            }
        });
        // console.log('Line ---- 110',result.data.chats);
        let messages = this.state.messages.slice(0);
        messages = [];
        let mainChat = result.data.chats;
        mainChat.map(function (x) {
            x.isEditMode = false;
            x.isHover = false;
            return x
        });
        messages = result.data.chats;
        console.log('Line ---- 195',messages);
        this.setState({ messages, userId: this.props.userId })
    }

    sendMessage(e, messagePost) {
        if (e.key === 'Enter') {
            if (e.target.value === "") {
                this.setState({ error: 'error' });
            } else {
                messagePost({ variables: { messages: this.state.text, senderName: this.props.senderName, receiverName: this.props.receiverName } });
                e.target.value = "";
                this.setState({ error: 'none', text: '' });
            }
        }
    }

    deleteMessage(e, messageDelete, chatConversationId) {
        e.preventDefault();
        messageDelete({ variables: { chatConversationId: chatConversationId, senderName: this.props.senderName, receiverName: this.props.receiverName } });
    }

    // select message when user click on edit 
    selectMessage(chatConversationId) {
        const messages = this.state.messages.slice(0);
        const foundIndex = messages.findIndex(message => message.chatConversationId === chatConversationId)
        if (foundIndex > -1) {
            let disabledChat = this.disableEditMode(messages);
            disabledChat[foundIndex].isEditMode = true;
            this.setState({ messages: disabledChat });
        }
    }

    updateMessage(e, messageUpdate, chatConversationId) {
        if (e.key === 'Enter') {
            if (e.target.value === "") {
                this.setState({ error: 'error' });
            } else {
                messageUpdate({ variables: { chatConversationId: chatConversationId, senderName: this.props.senderName, receiverName: this.props.receiverName, message: e.target.value, messageStatus: 'SEND' } });
                this.setState({ error: 'none', updateMessage: false });
            }
        }
    }

    // disable edit mode in all message
    disableEditMode(messages) {
        for (let i = 0; i < messages.length; i++) {
            messages[i].isEditMode = false;
        }
        return messages
    }

    // get message which is hover and set hover flag to true
    messageFoucused(chatConversationId){
        const messages = this.state.messages.slice(0);
        const foundIndex = messages.findIndex(message => message.chatConversationId === chatConversationId)
        if (foundIndex > -1) {
            let disabledHover = this.disableHover(messages);
            disabledHover[foundIndex].isHover = true;
            this.setState({ messages: disabledHover });
        }
    }

    // set hover flag to false
    disableHover(messages){
        for (let i = 0; i < messages.length; i++) {
            messages[i].isHover = false;
        }
        return messages
    }

    handleTextChange(e) {
        this.setState({ text: e.target.value });
    }

    handleEmojiClick = (emoji, e) => {
        let emojis = emoji.colons;
        this.setState({
            text: this.state.text + emojis,
            emojiShown: !this.state.emojiShown
        });
        this.messageInput.focus();
    }

    toogleEmojiState = () => {
        this.setState({
            emojiShown: !this.state.emojiShown
        });
    }

    render() {
        const data = this.props.data;
        if (data.loading) return 'Loading';
        if (data.error) return `${data.error}`;
        let messages = this.state.messages;
        return (
            <div className={"chat col-md-8 col-lg-9 "}>
                <div className="chat-header">
                    <div className="chat-about">
                        <div className="chat-with">{this.props.receiverName}</div>
                    </div>
                </div>
                <ScrollToBottom className="msj-rta macro">
                    {messages.map((chat, i) => (
                        <div style={{ position: 'relative' }} key={i}>
                            <div className={(chat.chatUserId === this.props.userId && chat.isHover === true? "edit-menu" : "display-none")}>
                                <ul>
                                    <li onClick={() => this.selectMessage(chat.chatConversationId)}>Edit</li>
                                    {
                                        <Mutation mutation={MESSAGE_DELETE}>
                                            {messageDelete => (
                                                <li onClick={(e) => this.deleteMessage(e, messageDelete, chat.chatConversationId)}>Delete</li>
                                            )}
                                        </Mutation>
                                    }
                                </ul>
                            </div>
                            <div key={i} className={"message " + (chat.chatUserId === this.props.userId ? "me" : "")}>
                                <div key={chat.chatUserId}>
                                    {<Mutation mutation={MESSAGE_UPDATE}>
                                        {messageUpdate => (
                                            chat.isEditMode === true ? <input type="text" className="edit-text" onKeyPress={(e) => this.updateMessage(e, messageUpdate, chat.chatConversationId)} /> : <span className="parser" onMouseEnter={()=>this.messageFoucused(chat.chatConversationId)}><Parser data={chat.message} /></span>
                                        )}
                                    </Mutation>}
                                </div>
                            </div>
                        </div>
                    ))}
                </ScrollToBottom>
                <Mutation mutation={MESSAGE_POST}>
                    {messagePost => (
                        <div className="text-bar">
                            <input type="text" ref={(mess) => { this.messageInput = mess; }} placeholder="Enter text.." value={this.state.text} onChange={(e) => this.handleTextChange(e)} onKeyPress={(e) => this.sendMessage(e, messagePost)} className={(this.state.error === "none" ? "" : "input-error")} />
                            <span id={this.state.emojiShown === false ? "show-emoji-no" : "show-emoji-yes"} onClick={this.toogleEmojiState}>{'😄'}</span>
                            {this.state.emojiShown === true ? <EmojiTable handleOnClick={this.handleEmojiClick} /> : null}
                        </div>
                    )}
                </Mutation>
            </div>
        );
    }
}

export default compose(
    graphql(MESSAGE_POST, { name: 'messagePost' }),
    graphql(MESSAGE_DELETE, { name: 'messageDelete' }),
    graphql(MESSAGE_UPDATE, { name: 'messageUpdate' }),
    graphql(GET_CHAT, { options: (props) => ({ variables: { sender: props.senderName, receiver: props.receiverName } }) }), withApollo)(CreateChat);