import React from "react";
import { Query, Mutation, Subscription } from "react-apollo";
import { gql } from "apollo-boost";

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

class CreateChat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sender: '',
            receiver: '',
            UserID: '',
            error: 'none',
            subscribedToNewLinks: false
        }
        this.sendMessage = this.sendMessage.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        return {
            sender: props.senderName,
            receiver: props.receiverName,
            UserID: props.userId
        }
    }

    _subscribeToNewLinks = subscribeToMore => {
        subscribeToMore({
            document: MESSAGE_SUBSCRIPTION,
            variables: { chat_user_id: this.props.userId },
            updateQuery: (prev, { subscriptionData }) => {
                console.log(subscriptionData);
                if (!subscriptionData) return prev;
                const newMessage = subscriptionData.data.postMessage;
                return prev.chats.push(newMessage);
            }
        })
        this.setState({ subscribedToNewLinks: true })
    }

    sendMessage(e, messagePost) {
        alert(e.key)
        if (e.key === 'Enter') {
            if (e.target.value === "") {
                this.setState({ error: 'error' });
            } else {
                let post = messagePost({ variables: { messages: e.target.value, senderName: this.props.senderName, receiverName: this.props.receiverName } });
                this.setState({ error: 'none' });
                e.target.value = "";
            }
        }
        
    }

    render() {
        return (
            <div className={"chat-wrapper frame " + (this.props.hidden === "show" ? "show" : "hidden")}>
                <div className="chat-header">
                    {this.props.receiverName}
                </div>
                <div className="msj-rta macro">
                    <Query query={GET_CHAT} variables={{ sender: this.props.senderName, receiver: this.props.receiverName }}>
                        {({ loading, data, error, subscribeToMore }) => {
                            if (loading) return 'Loading..';
                            if (error) return `${error}`;

                            if (!this.state.subscribedToNewLinks) {
                                this._subscribeToNewLinks(subscribeToMore)
                            }

                            return data.chats.map((chat, i) => (
                                <div key={i} className={"message " + (chat.chatUserId === this.props.userId ? "me" : "")} >
                                    <div key={chat.chatUserId}><p>{chat.message}</p></div>
                                </div>
                            ))
                        }}
                    </Query>
                </div>

                <Mutation mutation={MESSAGE_POST}>
                    {messagePost => (
                        <div className="text-bar">
                            <input type="text" placeholder="Enter text.." onKeyPress={(e) => { if (e.key === 'Enter') this.sendMessage(e, messagePost) }} className={(this.state.error === "none" ? "" : "input-error")} />
                        </div>

                    )}
                </Mutation>
            </div>
        );
    }
}

export default CreateChat;
