import React from "react";
import { Mutation, graphql, compose, withApollo } from "react-apollo";
import { gql } from "apollo-boost";
import { Picker, Parser } from 'mr-emoji';
import './createchat.css';
import ScrollToBottom from 'react-scroll-to-bottom';


// New schema query

const GET_CHAT = gql`
    query GetChat($chatRoomID:ID!, $memberID:ID!){
        chatconversationByChatRoomId(chatRoomID:$chatRoomID,memberID:$memberID){
            messageId
            message
            chatRoomID
            senderID
            sender{
                id
                userName
                firstName
            }
            messageType
            messageStatus
        }
    }
`;

const NEW_MESSAGE = gql`
    mutation newMessage($chatRoomID:ID!,$senderID:ID!,$message:String!,$messageType:MessageType!,$messageStatus:State!){
        newMessage(input:{
            chatRoomID:$chatRoomID,
            senderID:$senderID,
            message:$message,
            messageType:$messageType,
            messageStatus:$messageStatus}){
            messageId
            chatRoomID
            senderID
            sender{
                id
                userName
                firstName
            }
            message
            messageType
            messageStatus
            messageParentId
            createdAt
        }
    }
`;

const MESSAGE_POST_SUBSCRIPTION = gql`
    subscription messagePost($chatRoomID:ID!){
        messagePost(chatRoomID:$chatRoomID){
        messageId
        sender{
            id 
            userName
            firstName
            lastName
        }
        message
        messageType
        messageStatus
        }
    }
`;

const UPDATE_MESSAGE = gql`
    mutation updateMessage($message:String!, $senderID:ID!, $messageID:ID!, $chatRoomID:ID!){
        updateMessage(input:{
            message:$message,
            senderID:$senderID,
            messageID:$messageID,
            chatRoomID:$chatRoomID
        }){
            messageId
            message
            sender{
                id
                userName
                firstName
                lastName
            }
            chatRoomID
            senderID
            messageStatus
            messageType
        }
    }
`;

const UPDATE_MESSAGE_SUBSCRIPTION = gql`
    subscription messageUpdate($chatRoomID:ID!){
        messageUpdate(chatRoomID:$chatRoomID){
            messageId
            chatRoomID
            senderID
            sender{
                id
                userName
            }
            message
            messageType
            messageStatus
        }
    }
`;

const DELETE_MESSAGE = gql`
    mutation deleteMessage($deleteByID:ID!, $messageID:ID!, $chatRoomID:ID!){
        deleteMessage(input:{
            chatRoomID:$chatRoomID,
            messageID:$messageID,
            DeleteByID:$deleteByID
        }){
            messageId
            message
            sender{
                id
                userName
                firstName
                lastName
            }
            chatRoomID
            senderID
            messageStatus
            messageType
        }
    }
`;

const DELETE_MESSAGE_SUBSCRIPTION = gql`
    subscription messageDelete($chatRoomID:ID!){
        messageDelete(chatRoomID:$chatRoomID){
            messageId
            chatRoomID
            senderID
            sender{
                id
                userName
            }
            message
            messageType
            messageStatus
        }
    }
`;

//

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
            senderID: '',
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
            document: MESSAGE_POST_SUBSCRIPTION,
            variables: { chatRoomID: this.props.chatRoomID },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData) return prev;
                const message = this.state.messages;
                const newMessage = subscriptionData.data.messagePost;
                message.push(newMessage);
                this.setState({ message });
            }
        })

    componentDidMount() {

        this.addNewMessageSubscription;

        //subscription for delete message
        this.props.data.subscribeToMore({
            document: DELETE_MESSAGE_SUBSCRIPTION,
            variables: { chatRoomID: this.props.chatRoomID },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData) return prev;
                const messages = this.state.messages;
                const newMessage = subscriptionData.data.messageDelete;
                const deleteIndex = messages.findIndex(message => message.messageId === newMessage.messageId)
                if (deleteIndex > -1) {
                    messages.splice(deleteIndex, 1);
                    this.setState({ messages });
                }
            }
        })

        //subscription for update message
        this.props.data.subscribeToMore({
            document: UPDATE_MESSAGE_SUBSCRIPTION,
            variables: { chatRoomID: this.props.chatRoomID },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData) return prev;
                const newMessage = subscriptionData.data.messageUpdate;
                const messages = this.state.messages.slice(0);
                const updateIndex = messages.findIndex(message => message.messageId === newMessage.messageId)
                if (updateIndex > -1) {
                    messages[updateIndex] = newMessage;
                    this.setState({ messages });
                }
            }
        })
        this.fetchMessageFromQuery();
    }

    componentDidUpdate(prev) {
        // this.addNewMessageSubscription.unsubscribe();
        if (this.props.chatRoomID !== prev.chatRoomID) {
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
                chatRoomID: this.props.chatRoomID, memberID: this.props.memberID
            }
        });
        // console.log('Line ---- 110',result.data.chats);
        let messages = this.state.messages.slice(0);
        messages = [];
        let mainChat = result.data.chatconversationByChatRoomId;
        mainChat.map(function (x) {
            x.isEditMode = false;
            x.isHover = false;
            return x
        });
        messages = result.data.chatconversationByChatRoomId;
        this.setState({ messages, senderID: this.props.memberID })
    }

    sendMessage(e, newMessage) {
        if (e.key === 'Enter') {
            if (e.target.value === "") {
                this.setState({ error: 'error' });
            } else {
                newMessage({ variables: { chatRoomID: this.props.chatRoomID, senderID: this.props.memberID, message: this.state.text, messageType: 'TEXT', messageStatus: 'SEND' } });
                e.target.value = "";
                this.setState({ error: 'none', text: '' });
            }
        }
    }

    deleteMessage(e, deleteMessage, messageId) {
        e.preventDefault();
        deleteMessage({ variables: { deleteByID:this.props.memberID, messageID:messageId, chatRoomID:this.props.chatRoomID } });
    }

    // select message when user click on edit 
    selectMessage(messageId) {
        const messages = this.state.messages.slice(0);
        const foundIndex = messages.findIndex(message => message.messageId === messageId)
        if (foundIndex > -1) {
            let disabledChat = this.disableEditMode(messages);
            disabledChat[foundIndex].isEditMode = true;
            this.setState({ messages: disabledChat });
        }
    }

    updateMessage(e, messageUpdate, messageId) {
        if (e.key === 'Enter') {
            if (e.target.value === "") {
                this.setState({ error: 'error' });
            } else {
                messageUpdate({ variables: { message: e.target.value, senderID: this.props.memberID, messageID: messageId, chatRoomID: this.props.chatRoomID } });
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
    messageFoucused(messageId) {
        const messages = this.state.messages.slice(0);
        const foundIndex = messages.findIndex(message => message.messageId === messageId)
        if (foundIndex > -1) {
            let disabledHover = this.disableHover(messages);
            disabledHover[foundIndex].isHover = true;
            this.setState({ messages: disabledHover });
        }
    }

    // set hover flag to false
    disableHover(messages) {
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
                            <div className={(chat.sender.id === this.props.memberID && chat.isHover === true ? "edit-menu" : "display-none")}>
                                <ul>
                                    <li onClick={() => this.selectMessage(chat.messageId)}>Edit</li>
                                    {
                                        <Mutation mutation={DELETE_MESSAGE}>
                                            {deleteMessage => (
                                                <li onClick={(e) => this.deleteMessage(e, deleteMessage, chat.messageId)}>Delete</li>
                                            )}
                                        </Mutation>
                                    }
                                </ul>
                            </div>
                            <div key={i} className={"message " + (chat.sender.id === this.props.memberID ? "me" : "")}>
                                <div key={chat.chatUserId}>
                                    {<Mutation mutation={UPDATE_MESSAGE}>
                                        {updateMessage => (
                                            chat.isEditMode === true ? <input type="text" className="edit-text" onKeyPress={(e) => this.updateMessage(e, updateMessage, chat.messageId)} /> : <span className="parser" onMouseEnter={() => this.messageFoucused(chat.messageId)}><Parser data={chat.message} /></span>
                                        )}
                                    </Mutation>}
                                </div>
                            </div>
                        </div>
                    ))}
                </ScrollToBottom>
                <Mutation mutation={NEW_MESSAGE}>
                    {newMessage => (
                        <div className="text-bar">
                            <input type="text" ref={(mess) => { this.messageInput = mess; }} placeholder="Enter text.." value={this.state.text} onChange={(e) => this.handleTextChange(e)} onKeyPress={(e) => this.sendMessage(e, newMessage)} className={(this.state.error === "none" ? "" : "input-error")} />
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
    graphql(NEW_MESSAGE, { name: 'newMessage' }),
    graphql(DELETE_MESSAGE, { name: 'deleteMessage' }),
    graphql(UPDATE_MESSAGE, { name: 'updateMessage' }),
    graphql(GET_CHAT, { options: (props) => ({ variables: { chatRoomID: props.chatRoomID, memberID: props.memberID } }) }), withApollo)(CreateChat);