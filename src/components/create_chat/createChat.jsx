import React from "react";
import { Query, Mutation } from "react-apollo";
import { gql } from "apollo-boost";
import { Picker, Parser } from 'mr-emoji';
import './createchat.css';

const GET_CHAT = gql`
    query GetChat($sender:String!,$receiver:String!){
        chats(senderName:$sender,receiverName:$receiver){
            message
            chatUserId
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
            subscribedToNewMessage: false,
            emojiShown: false,
            text: ''
        }
        this.sendMessage = this.sendMessage.bind(this);
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleCheckbox = this.handleCheckbox.bind(this);
    }


    // subsctiption when new message arrives
    _subscribeToNewMessage = subscribeToMore => {
        console.log('Line ---- 56', this.props.userId);
        subscribeToMore({
            document: MESSAGE_SUBSCRIPTION,
            variables: { chat_user_id: this.props.userId },
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData) return prev;
                const newMessage = subscriptionData.data.postMessage;
                return prev.chats.push(newMessage);
            }
        })
        this.setState({ subscribedToNewMessage: true })
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

    handleCheckbox() {
        this.setState({ checked: !this.state.checked });
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
    }

    toogleEmojiState = () => {
        this.setState({
            emojiShown: !this.state.emojiShown
        });
    }

    render() {
        return (
            <div className={"chat col-md-8 col-lg-9 "}>
                <div className="chat-header">
                    <div className="chat-about">
                        <div className="chat-with">{this.props.receiverName}</div>
                    </div>
                </div>
                <div className="msj-rta macro">
                    <Query query={GET_CHAT} variables={{ sender: this.props.senderName, receiver: this.props.receiverName }}>
                        {({ loading, data, error, subscribeToMore }) => {
                            if (loading) return 'Loading..';
                            if (error) return `${error}`;

                            if (!this.state.subscribedToNewMessage) {
                                this._subscribeToNewMessage(subscribeToMore)
                            }

                            return data.chats.map((chat, i) => (
                                <div key={i} className={"message " + (chat.chatUserId === this.props.userId ? "me" : "")} >
                                    {console.log('Line ---- 123',chat.chatUserId +"==="+ this.props.userId)}
                                    <div key={chat.chatUserId}><span className="parser"><Parser data={chat.message} /></span></div>
                                </div>
                            ))
                        }}
                    </Query>
                </div>

                <Mutation mutation={MESSAGE_POST}>
                    {messagePost => (
                        <div className="text-bar">
                            <input type="text" placeholder="Enter text.." value={this.state.text} onChange={(e) => this.handleTextChange(e)} onKeyPress={(e) => this.sendMessage(e, messagePost)} className={(this.state.error === "none" ? "" : "input-error")} />
                            <span id={this.state.emojiShown === false ? "show-emoji-no" : "show-emoji-yes"} onClick={this.toogleEmojiState}>{'😄'}</span>
                            {this.state.emojiShown === true ? <EmojiTable handleOnClick={this.handleEmojiClick} /> : null}
                        </div>
                    )}
                </Mutation>
            </div>
        );
    }
}

export default CreateChat;
