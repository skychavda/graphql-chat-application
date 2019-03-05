import React from 'react';
import {
	Mutation, graphql, compose, withApollo,
} from 'react-apollo';
import { gql } from 'apollo-boost';
import { Picker, Parser } from 'mr-emoji';
import './createchat.css';
import PropTypes from 'prop-types';
import ScrollToBottom from 'react-scroll-to-bottom';
import GroupInfo from '../group_info/groupinfo';

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
        chatRoomID
        senderID
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

const EmojiTable = onClickEmoji => (
	<div className="emoji-table">
		<Picker perLine="7" showPreview="false" onClick={onClickEmoji.handleOnClick} />
	</div>
);

class CreateChat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: 'none',
      emojiShown: false,
      text: '',
      senderID: '',
      messages: [],
      chatConversationId: '',
      emojiArray: ['🤣', '😊', '😂', '😍', '😁', '😉', '😎', '😜'],
      emoji: '',
      emojiNumber: 0,
      first: true,
      groupInfo: false,
      hideChatBox: true,
    };
    this.sendMessage = this.sendMessage.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.fetchMessageFromQuery = this.fetchMessageFromQuery.bind(this);
    this.addNewMessageSubscription = this.addNewMessageSubscription.bind(this);
    this.handleGroupInfo = this.handleGroupInfo.bind(this);
  }

  addNewMessageSubscription() {
    this.props.client.cache.reset();
    // subscription for add new message
    this.props.data.subscribeToMore({
			document: MESSAGE_POST_SUBSCRIPTION,
			variables: { chatRoomID: this.props.chatRoomID },
			updateQuery: (prev, { subscriptionData }) => {
				if (!subscriptionData) return prev;
				const message = this.state.messages;
				prev = message;
				const newMessage = subscriptionData.data.messagePost;
				const anotherUserSubscription = prev.find(
					user => user.chatRoomID === newMessage.chatRoomID,
				);

				if (prev.length === 0) {
					const result = Object.assign({}, prev, {
						chatconversationByChatRoomId: [...prev, newMessage],
					});
					this.setState({ messages: result.chatconversationByChatRoomId });
				}
				if (!anotherUserSubscription || newMessage.messageId === prev[prev.length - 1].messageId) {
					return prev;
				}
				const result = Object.assign({}, prev, {
					chatconversationByChatRoomId: [...prev, newMessage],
				});
				this.setState({ messages: result.chatconversationByChatRoomId });
			},
		});
	}

	componentDidMount() {
		this.addNewMessageSubscription();

		// subscription for delete message
		this.props.data.subscribeToMore({
			document: DELETE_MESSAGE_SUBSCRIPTION,
			variables: { chatRoomID: this.props.chatRoomID },
			updateQuery: (prev, { subscriptionData }) => {
				if (!subscriptionData) return prev;
				const { messages } = this.state;
				const newMessage = subscriptionData.data.messageDelete;
				const deleteIndex = messages.findIndex(message => message.messageId === newMessage.messageId);
				if (deleteIndex > -1) {
					messages.splice(deleteIndex, 1);
					this.setState({ messages });
				}
			},
		});

		// subscription for update message
		this.props.data.subscribeToMore({
			document: UPDATE_MESSAGE_SUBSCRIPTION,
			variables: { chatRoomID: this.props.chatRoomID },
			updateQuery: (prev, { subscriptionData }) => {
				if (!subscriptionData) return prev;
				const newMessage = subscriptionData.data.messageUpdate;
				const messages = this.state.messages.slice(0);
				const updateIndex = messages.findIndex(message => message.messageId === newMessage.messageId);
				if (updateIndex > -1) {
					messages[updateIndex] = newMessage;
					this.setState({ messages });
				}
			},
		});
		this.fetchMessageFromQuery();
	}

	componentDidUpdate(prev) {
		const { first } = this.state;
		if (this.props.chatRoomID !== prev.chatRoomID || first) {
			this.fetchMessageFromQuery();
			// this.addNewMessageSubscription();
			this.componentDidMount();
			this.setState({ first: false, groupInfo: false, hideChatBox: true });
		}
	}

	fetchMessageFromQuery = async () => {
		const { client } = this.props;
		this.props.client.cache.reset();
		const result = await client.query({
			query: GET_CHAT,
			variables: {
				chatRoomID: this.props.chatRoomID, memberID: this.props.memberID,
			},
		});
		let messages = this.state.messages.slice(0);
		messages = [];
		const mainChat = result.data.chatconversationByChatRoomId;
		mainChat.map((x) => {
			x.isEditMode = false;
			x.isHover = false;
			return x;
		});
		messages = result.data.chatconversationByChatRoomId;
		this.setState({ messages, senderID: this.props.memberID });
	}

	sendMessage(e, newMessage) {
		if (e.key === 'Enter') {
			if (e.target.value === '') {
				this.setState({ error: 'error' });
			}
			else {
				newMessage({
					variables: {
						chatRoomID: this.props.chatRoomID, senderID: this.props.memberID, message: this.state.text, messageType: 'TEXT', messageStatus: 'SEND',
					},
				});
				e.target.value = '';
				this.setState({ error: 'none', text: '' });
			}
		}
	}

	deleteMessage(e, deleteMessage, messageId) {
		e.preventDefault();
		deleteMessage({ variables: { deleteByID: this.props.memberID, messageID: messageId, chatRoomID: this.props.chatRoomID } });
	}

	// select message when user click on edit
	selectMessage(messageId) {
		const messages = this.state.messages.slice(0);
		const foundIndex = messages.findIndex(message => message.messageId === messageId);
		if (foundIndex > -1) {
			const disabledChat = this.disableEditMode(messages);
			disabledChat[foundIndex].isEditMode = true;
			this.setState({ messages: disabledChat });
		}
	}

	// update message query
	updateMessage(e, messageUpdate, messageId) {
		if (e.key === 'Enter') {
			if (e.target.value === '') {
				this.setState({ error: 'error' });
			}
			else {
				messageUpdate({
					variables: {
						message: e.target.value, senderID: this.props.memberID, messageID: messageId, chatRoomID: this.props.chatRoomID,
					},
				});
				this.setState({ error: 'none', updateMessage: false });
			}
		}
	}

	// disable edit mode in all message
	disableEditMode(messages) {
		for (let i = 0; i < messages.length; i++) {
			messages[i].isEditMode = false;
		}
		return messages;
	}

	// get message which is hover and set hover flag to true
	messageFoucused(messageId) {
		const messages = this.state.messages.slice(0);
		const foundIndex = messages.findIndex(message => message.messageId === messageId);
		if (foundIndex > -1) {
			const disabledHover = this.disableHover(messages);
			disabledHover[foundIndex].isHover = true;
			this.setState({ messages: disabledHover });
		}
	}

	// set hover flag to false
	disableHover(messages) {
		for (let i = 0; i < messages.length; i++) {
			messages[i].isHover = false;
		}
		return messages;
	}

  handleGroupInfo() {
    const { hideChatBox, groupInfo } = this.state;
    this.setState({ hideChatBox: !hideChatBox, groupInfo: !groupInfo });
  }

  handleTextChange(e) {
    this.setState({ text: e.target.value });
	}

  handleEmojiClick = (emoji) => {
    const emojis = emoji.colons;
    const { text, emojiShown } = this.state;
    this.setState({
      text: text + emojis,
      emojiShown: !emojiShown,
    });
    this.messageInput.focus();
  }

  toogleEmojiState = () => {
    let { emojiNumber } = this.state;
    this.setState({
      emojiShown: !emojiNumber,
    });
    if (emojiNumber !== 7) {
      emojiNumber += 1;
    }
    else {
      emojiNumber = 0;
    }
    this.setState({ emojiNumber: emojiNumber += 1 });
  }

	render() {
		const { data } = this.props;
		if (data.loading) return 'Loading';
		if (data.error) return console.log('message display');
		const { messages } = this.state;
		// console.log('Line ---- 393',messages);
		const emoji = this.state.emojiArray[this.state.emojiNumber];
		return (
			<div className="chat col-md-8 col-lg-9 ">
				<div className="chat-header">
					<div className="chat-about">
						<div className="chat-with" onClick={this.props.chatRoomType === 'GROUP' ? e => this.handleGroupInfo(e) : null}>
							{this.state.groupInfo === true ? 'Group-Info' : this.props.receiverName}
						</div>
					</div>
				</div>
				{this.state.hideChatBox && (
					<ScrollToBottom className="msj-rta macro">
						{messages.map((chat, i) => (
							<div style={{ position: 'relative' }} key={chat.messageId}>
								<div className={(chat.sender.id === this.props.memberID && chat.isHover === true ? 'edit-menu' : 'display-none')}>
									<ul>
										<li className="icon icon-edit" onClick={() => this.selectMessage(chat.messageId)}><i className="fas fa-edit" /></li>
										{
											<Mutation mutation={DELETE_MESSAGE}>
												{deleteMessage => (
													<li className="icon icon-del" onClick={e => this.deleteMessage(e, deleteMessage, chat.messageId)}><i className="fas fa-trash-alt" /></li>
												)}
											</Mutation>
										}
									</ul>
								</div>
								<div key={chat.messageId} className={`message ${chat.sender.id === this.props.memberID ? 'me' : ''}`}>
									<div key={chat.chatUserId}>
										{<Mutation mutation={UPDATE_MESSAGE}>
											{updateMessage => (
												chat.isEditMode === true ? <input type="text" className="edit-text" onKeyPress={e => this.updateMessage(e, updateMessage, chat.messageId)} /> : <span className="parser" onMouseEnter={() => this.messageFoucused(chat.messageId)}><Parser data={chat.message} /></span>
											)}
										</Mutation>}
									</div>
								</div>
								{this.props.chatRoomType === 'GROUP' && (
									<div key={i} className={`username ${chat.sender.id === this.props.memberID ? 'me' : ''}`}>
										<p>{chat.sender.userName}</p>
									</div>
								)}
							</div>
						))}
					</ScrollToBottom>
				)}
				{this.state.hideChatBox && (
					<Mutation mutation={NEW_MESSAGE}>
						{newMessage => (
							<div className="text-bar">
								<input type="text" ref={(mess) => { this.messageInput = mess; }} placeholder="Enter text.." value={this.state.text} onChange={e => this.handleTextChange(e)} onKeyPress={e => this.sendMessage(e, newMessage)} className={`text-box ${this.state.error === 'none' ? '' : 'input-error'}`} />
								<span id={this.state.emojiShown === false ? 'show-emoji-no' : 'show-emoji-yes'} onClick={this.toogleEmojiState}>{emoji}</span>
								{this.state.emojiShown === true ? <EmojiTable handleOnClick={this.handleEmojiClick} /> : null}
							</div>
						)}
					</Mutation>
				)}
				{this.state.groupInfo && <GroupInfo list={this.props.list} chatRoomID={this.props.chatRoomID} memberID={this.props.memberID} receiverName={this.props.receiverName} onHandleGroupInfo={this.handleGroupInfo} onLeaveGroup={this.props.leaveGroup} />}
			</div>
		);
	}
}

export default compose(
	graphql(NEW_MESSAGE, { name: 'newMessage' }),
	graphql(DELETE_MESSAGE, { name: 'deleteMessage' }),
	graphql(UPDATE_MESSAGE, { name: 'updateMessage' }),
	graphql(GET_CHAT, { options: props => ({ variables: { chatRoomID: props.chatRoomID, memberID: props.memberID } }) }), withApollo,
)(CreateChat);

CreateChat.propTypes = {
	error: PropTypes.string,
	emojiShown: PropTypes.bool,
	text: PropTypes.string,
	senderID: PropTypes.string,
	messages: PropTypes.array,
	chatConversationId: PropTypes.string,
	emojiArray: PropTypes.array,
	emoji: PropTypes.string,
	emojiNumber: PropTypes.number,
	first: PropTypes.bool,
	groupInfo: PropTypes.bool,
	hideChatBox: PropTypes.bool,
}