import React from 'react';
import {
  Mutation, graphql, compose, withApollo,
} from 'react-apollo';
import { gql } from 'apollo-boost';
import { Picker, Parser } from 'mr-emoji';
import PropTypes from 'prop-types';
import ScrollToBottom from 'react-scroll-to-bottom';
import GroupInfo from '../group_info/groupinfo';

// New schema query

const GET_CHAT = gql`
    query GetChat($chatRoomID:ID!, $memberID:ID!){
        chatconversationByChatRoomId(chatRoomID:$chatRoomID,memberID:$memberID){
            messageId
            createdAt
            messageParentId
            message
            chatRoomID
            senderID
            sender{
                id
                userName
                firstName
                lastName
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
        createdAt
        messageParentId
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
  // disable edit mode in all message
  static disableEditMode(messages) {
    for (let i = 0; i < messages.length; i++) {
      messages[i].isEditMode = false;
    }
    return messages;
  }

  constructor(props) {
    super(props);
    this.state = {
      error: 'none',
      emojiShown: false,
      text: '',
      messages: [],
      emojiArray: ['🤣', '😊', '😂', '😍', '😁', '😉', '😎', '😜'],
      emojiNumber: 0,
      first: true,
      groupInfo: false,
      hideChatBox: true,
      editMessage: '',
    };
    this.sendMessage = this.sendMessage.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.fetchMessageFromQuery = this.fetchMessageFromQuery.bind(this);
    this.addNewMessageSubscription = this.addNewMessageSubscription.bind(this);
    this.deleteMessageSubscription = this.deleteMessageSubscription.bind(this);
    this.updateMessageSubscription = this.updateMessageSubscription.bind(this);
    this.handleGroupInfo = this.handleGroupInfo.bind(this);
    this.handleEditMessage = this.handleEditMessage.bind(this);
    this.disableHover = this.disableHover.bind(this);
  }

  componentDidMount() {
    // this.addNewMessageSubscription();
    this.deleteMessageSubscription();
    this.updateMessageSubscription();
    this.fetchMessageFromQuery();
  }

  componentDidUpdate(prevProps) {
    const { first } = this.state;
    const { chatRoomId } = this.props;
    if (chatRoomId !== prevProps.chatRoomId || first) {
      this.fetchMessageFromQuery();
      this.deleteMessageSubscription();
      this.updateMessageSubscription();
    }
  }

fetchMessageFromQuery = async () => {
  const { client, chatRoomId, memberId } = this.props;
  let { messages } = this.state;
  client.cache.reset();
  const result = await client.query({
    query: GET_CHAT,
    variables: {
      chatRoomID: chatRoomId, memberID: memberId,
    },
  });
  messages = [];
  const mainChat = result.data.chatconversationByChatRoomId;
  mainChat.map((x) => {
    x.isEditMode = false;
    x.isHover = false;
    return x;
  });
  messages = result.data.chatconversationByChatRoomId;
  this.setState({
    messages, first: false, groupInfo: false, hideChatBox: true,
  }, () => {
    this.addNewMessageSubscription();
  });
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
  if (emojiNumber !== 7) {
    emojiNumber += 1;
  }
  else {
    emojiNumber = 0;
  }
  this.setState({ emojiNumber, emojiShown: !this.state.emojiShown });
}

// set hover flag to false
disableHover = (messages) => {
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

// get message which is hover and set hover flag to true
messageFoucused(messageId) {
  const { messages } = this.state;
  // const messages = messages.slice(0);
  const foundIndex = messages.findIndex(message => message.messageId === messageId);
  if (foundIndex > -1) {
    const disabledHover = this.disableHover(messages);
    disabledHover[foundIndex].isHover = true;
    this.setState({ messages: disabledHover });
  }
}

addNewMessageSubscription() {
  const { client, data, chatRoomId } = this.props;
  client.cache.reset();
  // subscription for add new message
  data.subscribeToMore({
    document: MESSAGE_POST_SUBSCRIPTION,
    variables: { chatRoomID: chatRoomId },
    updateQuery: (prev, { subscriptionData }) => {
      if (!subscriptionData) return prev;
      const { messages } = this.state;
      prev = messages;
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
      return result;
    },
  });
}

deleteMessageSubscription() {
  const { data, chatRoomId } = this.props;
  // subscription for delete message
  data.subscribeToMore({
    document: DELETE_MESSAGE_SUBSCRIPTION,
    variables: { chatRoomID: chatRoomId },
    updateQuery: (prev, { subscriptionData }) => {
      if (!subscriptionData) return prev;
      const { messages } = this.state;
      const newMessage = subscriptionData.data.messageDelete;
      const deleteIndex = messages.findIndex(message => message.messageId === newMessage.messageId);
      if (deleteIndex > -1) {
        messages.splice(deleteIndex, 1);
        this.setState({ messages });
      }
      return false;
    },
  });
}

updateMessageSubscription() {
  const { data, chatRoomId } = this.props;
  // subscription for update message
  data.subscribeToMore({
    document: UPDATE_MESSAGE_SUBSCRIPTION,
    variables: { chatRoomID: chatRoomId },
    updateQuery: (prev, { subscriptionData }) => {
      if (!subscriptionData) return prev;
      const newMessage = subscriptionData.data.messageUpdate;
      const { messages } = this.state;
      const updateIndex = messages.findIndex(message => message.messageId === newMessage.messageId);
      if (updateIndex > -1) {
        messages[updateIndex] = newMessage;
        this.setState({ messages });
      }
      return false;
    },
  });
}

sendMessage(e, newMessage) {
  const { chatRoomId, memberId } = this.props;
  const { text } = this.state;
  if (e.key === 'Enter') {
    if (e.target.value === '') {
      this.setState({ error: 'error' });
    }
    else {
      newMessage({
        variables: {
          chatRoomID: chatRoomId, senderID: memberId, message: text, messageType: 'TEXT', messageStatus: 'SEND',
        },
      });
      e.target.value = '';
      this.setState({ error: 'none', text: '' });
    }
  }
}

deleteMessage(e, deleteMessage, messageId) {
  const { memberId, chatRoomId } = this.props;
  e.preventDefault();
  deleteMessage({ variables: { deleteByID: memberId, messageID: messageId, chatRoomID: chatRoomId } });
}

// select message when user click on edit
selectMessage(messageId, editMessage) {
  const { messages } = this.state;
  // const messages = this.state.messages.slice(0);
  const foundIndex = messages.findIndex(message => message.messageId === messageId);
  if (foundIndex > -1) {
    const disabledChat = CreateChat.disableEditMode(messages);
    disabledChat[foundIndex].isEditMode = true;
    this.setState({ messages: disabledChat, editMessage });
  }
}

// update message query
updateMessage(e, messageUpdate, messageId) {
  const { memberId, chatRoomId } = this.props;
  if (e.key === 'Enter') {
    if (e.target.value === '') {
      this.setState({ error: 'error' });
    }
    else {
      messageUpdate({
        variables: {
          message: e.target.value, senderID: memberId, messageID: messageId, chatRoomID: chatRoomId,
        },
      });
      this.setState({ error: 'none' });
    }
  }
}

handleEditMessage(e) {
  this.setState({ editMessage: e.target.value });
}

render() {
  const {
    data, chatRoomType, receiverName, memberId, list, chatRoomId, leaveGroup,
  } = this.props;
  if (data.loading) return 'Loading';
  if (data.error) return `${data.error}`;
  const {
    messages, emojiArray, emojiNumber, groupInfo, hideChatBox, text, emojiShown, error, editMessage,
  } = this.state;
  const emoji = emojiArray[emojiNumber];
  return (
    <div className="chat col-md-8 col-lg-9 ">
      <div className="chat-header">
        <div className="chat-about">
          <div className="chat-with" onClick={chatRoomType === 'GROUP' ? e => this.handleGroupInfo(e) : null} aria-hidden="true">
            {groupInfo === true ? 'Group-Info' : receiverName}
          </div>
        </div>
      </div>
      {hideChatBox && (
      <ScrollToBottom className="msj-rta macro">
        {messages.map((chat, i) => (
          <div style={{ position: 'relative' }} key={chat.messageId}>
            <div className={(chat.sender.id === memberId && chat.isHover === true ? 'edit-menu' : 'display-none')}>
              <ul>
                <li className="icon icon-edit" onClick={() => this.selectMessage(chat.messageId, chat.message)} aria-hidden="true"><i className="fas fa-edit" /></li>
                {
                  <Mutation mutation={DELETE_MESSAGE}>
                    {deleteMessage => (
                      <li className="icon icon-del" onClick={e => this.deleteMessage(e, deleteMessage, chat.messageId)} aria-hidden="true"><i className="fas fa-trash-alt" /></li>
                    )}
                  </Mutation>
                }
              </ul>
            </div>
            <div key={chat.messageId} className={`message ${chat.sender.id === memberId ? 'me' : ''}`}>
              <div key={chat.chatUserId}>
                {
                  <Mutation mutation={UPDATE_MESSAGE}>
                    {updateMessage => (
                      chat.isEditMode === true ? <input type="text" value={editMessage} onChange={e => this.handleEditMessage(e)} className="edit-text" onKeyPress={e => this.updateMessage(e, updateMessage, chat.messageId)} /> : <span className="parser" onMouseEnter={() => this.messageFoucused(chat.messageId)}><Parser data={chat.message} /></span>
                    )}
                  </Mutation>
                }
              </div>
            </div>
            {chatRoomType === 'GROUP' && (
            <div key={chat.sender.id} className={`username ${chat.sender.id === memberId ? 'me' : ''}`}>
              <p>{chat.sender.userName}</p>
            </div>
            )}
          </div>
        ))}
      </ScrollToBottom>
      )}
      {hideChatBox && (
      <Mutation mutation={NEW_MESSAGE}>
        {newMessage => (
          <div className="text-bar">
            <input type="text" ref={(mess) => { this.messageInput = mess; }} placeholder="Enter text.." value={text} onChange={e => this.handleTextChange(e)} onKeyPress={e => this.sendMessage(e, newMessage)} className={`text-box ${error === 'none' ? '' : 'input-error'}`} />
            <span id={emojiShown === false ? 'show-emoji-no' : 'show-emoji-yes'} onClick={this.toogleEmojiState} aria-hidden="true">{emoji}</span>
            {emojiShown === true ? <EmojiTable handleOnClick={this.handleEmojiClick} /> : null}
          </div>
        )}
      </Mutation>
      )}
      {groupInfo && <GroupInfo list={list} chatRoomId={chatRoomId} memberId={memberId} receiverName={receiverName} onHandleGroupInfo={this.handleGroupInfo} onLeaveGroup={leaveGroup} />}
    </div>
  );
}
}

export default compose(
  graphql(NEW_MESSAGE, { name: 'newMessage' }),
  graphql(DELETE_MESSAGE, { name: 'deleteMessage' }),
  graphql(UPDATE_MESSAGE, { name: 'updateMessage' }),
  graphql(GET_CHAT, { options: props => ({ variables: { chatRoomID: props.chatRoomId, memberID: props.memberId } }) }), withApollo,
)(CreateChat);

CreateChat.propTypes = {
  memberId: PropTypes.string,
  chatRoomId: PropTypes.string,
  client: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.object, PropTypes.array]),
  data: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.object, PropTypes.array]),
  chatRoomType: PropTypes.string,
  receiverName: PropTypes.string,
  list: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.object, PropTypes.array]),
  leaveGroup: PropTypes.func,
};

CreateChat.defaultProps = {
  memberId: '1',
  chatRoomId: '2',
  client: PropTypes.object,
  data: PropTypes.object,
  chatRoomType: PropTypes.string,
  receiverName: PropTypes.string,
  list: PropTypes.array,
  leaveGroup: PropTypes.func,
};
