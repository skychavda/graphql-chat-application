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
        messageDelete(chatConversationId:$chatConversationId,senderName:$senderName,receiverName:$receiverName)
    }
`;

const MESSAGE_UPDATE = gql`
mutation MessageUpdate($chatConversationId:ID!,$senderName:String!,$receiverName:String!,$message:String!){
  messageUpdate(chatConversationId:$chatConversationId, senderName:$senderName, receiverName:$receiverName, message:$message, messageStatus:SEND){
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
            updateMessage: false
        };
        this.sendMessage = this.sendMessage.bind(this);
        this.handleTextChange = this.handleTextChange.bind(this);
        this.fetchMessageFromQuery = this.fetchMessageFromQuery.bind(this);
    }

    componentDidMount() {
        //subscription for add new message
        this.props.data.subscribeToMore({
            document: MESSAGE_SUBSCRIPTION,
            variables: { chat_user_id: this.props.userId },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData) return prev;
                const message = this.state.messages;
                const newMessage = subscriptionData.data.postMessage;
                return message.push(newMessage);
            }
        })

        //subscription for delete message
        this.props.data.subscribeToMore({
            document: DELETE_MESSAGE_SUBSCRIPION,
            variables: { chat_user_id: this.props.userId },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData) return prev;
                const messages = this.state.messages;
                const newMessage = subscriptionData.data.deleteMessage;
                console.log('Line ---- 99', newMessage);
                return messages.findIndex(this.filterDeletedMessage(newMessage))
            }
        })
        this.fetchMessageFromQuery();
    }

    componentDidUpdate(prev) {
        if (this.props.receiverName !== prev.receiverName) {
            this.fetchMessageFromQuery();
        }
    }

    filterDeletedMessage(element) {
        const messages = this.state.messages;
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].chatConversationId === element.chatConversationId) {
                messages.splice(i);
                this.setState({ messages: messages.splice(element) });
            }
        }
        return messages;
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
        messages = result.data.chats;
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
        const result = messageDelete({ variables: { chatConversationId: chatConversationId, senderName: this.props.senderName, receiverName: this.props.receiverName } })
        console.log('Line ---- 160',result);
    }

    updateMessage(e, messageUpdate, chatConversationId) {
        this.setState({ updateMessage: !this.state.updateMessage })
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
                            <div key={i} className={"message " + (chat.chatUserId === this.props.userId ? "me" : "")}>
                                <div key={chat.chatUserId}>
                                    {this.state.updateMessage === true ? <input type="text" value={chat.message}/> : <span className="parser"><Parser data={chat.message} /></span>}
                                </div>
                            </div>
                            <div className={(chat.chatUserId === this.props.userId ? "edit-menu" : "display-none")}>
                                <ul>
                                    {<Mutation mutation={MESSAGE_UPDATE}>
                                        {messageUpdate => (
                                            <li onClick={(e) => this.updateMessage(e, messageUpdate, chat.chatConversationId)}>Edit</li>
                                        )}
                                    </Mutation>}
                                    {
                                        <Mutation mutation={MESSAGE_DELETE}>
                                            {messageDelete => (
                                                <li onClick={(e) => this.deleteMessage(e, messageDelete, chat.chatConversationId)}>Delete</li>
                                            )}
                                        </Mutation>
                                    }
                                </ul>
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
    graphql(GET_CHAT, { options: (props) => ({ variables: { sender: props.senderName, receiver: props.receiverName } }) }), withApollo)(CreateChat);