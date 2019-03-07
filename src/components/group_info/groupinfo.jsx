import React from 'react';
import gql from 'graphql-tag';
import {
  Mutation, compose, withApollo, graphql,
} from 'react-apollo';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import ProfileUser from '../profile_user/profileuser';
import SearchUser from '../search_user/searchuser';
// import './groupinfo.css';

const MEMBER_LIST_BY_CHATROOM = gql`
    query memberListByChatRoomId($chatRoomID:ID!, $memberID:ID!){
    memberListByChatRoomId(chatRoomID:$chatRoomID,memberID:$memberID){
        memberCount
        members{
            id
            chatRoomID
            member{
                id
                userName
            }
            joinAt
        }
    }
}
`;

const MEMBER_LIST_WHICH_IS_NOT_IN_GROUP = gql`
    query memberListWhichAreNotMembersOfChatRoom($chatRoomID:ID!,$memberID:ID!){
        MemberListWhichAreNoTMembersOfChatRoom(chatRoomID:$chatRoomID,memberID:$memberID){
            id
            userName
            firstName
            lastName
            email
        }
    }
`;

const UPDATE_CHAT_ROOM_DETAILS = gql`
    mutation updateChatRoomDetail($chatRoomID:ID!,$chatRoomName:String!,$updateByID:ID!){
        updateChatRoomDetail(input:{
            chatRoomID: $chatRoomID,
            chatRoomName: $chatRoomName,
            updateByID: $updateByID
        }){
            chatRoomID
            creatorID
            creator{
                id
                userName
            }
            chatRoomName
            chatRoomType
            members{
                id
                chatRoomID
            }
            createdAt
        }
    }
`;

const NEW_CHAT_ROOM_MEMBER = gql`
    mutation newChatRoomMembers($chatRoomID:ID!,$creatorID:ID!,$memberIDs:[ID!]){
        newChatRoomMembers(input:{
            chatRoomID: $chatRoomID,
            creatorID: $creatorID
            memberIDs: $memberIDs
        })
    }
`;

const LEAVE_CHAT_ROOM = gql`
    mutation leaveChatRoom($chatRoomID:ID!, $memberID:ID!){
        leaveChatRoom(input:{
            chatRoomID:$chatRoomID,
            memberID:$memberID
        })
    }
`;

const groupMemberList = [];

class GroupInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputBox: false,
      receiverName: props.receiverName,
      messages: [],
      userList: [],
      filterUserList: [],
      participentList: false,
      colors: ['#bccad6', '#8d9db6', '#667292', '#054158', '#054f7c', '#1f6aa3', '#6494b1', '#c2d5e3'],
    };
    this.fetchMemberFromQuery = this.fetchMemberFromQuery.bind(this);
    this.fetchMemberNotInGroupQuery = this.fetchMemberNotInGroupQuery.bind(this);
    this.filterUser = this.filterUser.bind(this);
    this.appendCheckedFlagToMessage = this.appendCheckedFlagToMessage.bind(this);
  }

  componentDidMount() {
    this.fetchMemberFromQuery();
    this.fetchMemberNotInGroupQuery();
  }

    fetchMemberFromQuery = async () => {
      const { client, chatRoomId, memberId } = this.props;
      await client.query({
        query: MEMBER_LIST_BY_CHATROOM,
        variables: {
          chatRoomID: chatRoomId, memberID: memberId,
        },
      });
      // this.setState({ memberList: result.data.memberListByChatRoomId });
    }

    fetchMemberNotInGroupQuery = async () => {
      const { client, chatRoomId, memberId } = this.props;
      const result = await client.query({
        query: MEMBER_LIST_WHICH_IS_NOT_IN_GROUP,
        variables: {
          chatRoomID: chatRoomId, memberID: memberId,
        },
      });
      this.setState({ filterUserList: result.data.MemberListWhichAreNoTMembersOfChatRoom, userList: result.data.MemberListWhichAreNoTMembersOfChatRoom });
      this.appendCheckedFlagToMessage();
    }

    updateChatRoomName = async (e, updateChatRoomDetail) => {
      if (e.key === 'Enter') {
        const { chatRoomId, memberId } = this.props;
        const result = await updateChatRoomDetail({ variables: { chatRoomID: chatRoomId, chatRoomName: e.target.value, updateByID: memberId } });
        this.setState({ inputBox: false, receiverName: result.data.updateChatRoomDetail.chatRoomName });
      }
    }

    handleAddMember = async (e, newChatRoomMembers) => {
      const { chatRoomId, memberId, onHandleGroupInfo } = this.props;
      await newChatRoomMembers({ variables: { chatRoomID: chatRoomId, creatorID: memberId, memberIDs: groupMemberList } });
      onHandleGroupInfo(e);
      e.preventDefault();
    }

    appendCheckedFlagToMessage() {
      const { filterUserList } = this.state;
      let messages = [];
      const mainChat = filterUserList;
      mainChat.map((x) => {
        x.isChecked = false;
        return x;
      });
      messages = mainChat;
      this.setState({ messages });
    }

    toggleInputBox() {
      const { inputBox } = this.state;
      this.setState({ inputBox: !inputBox });
    }

    addParticipent() {
      const { participentList } = this.state;
      this.setState({ participentList: !participentList });
    }

    addUserToGroupList(e, id) {
      e.preventDefault();
      const { messages } = this.state;
      const index = groupMemberList.findIndex(list => list === id);
      if (index > -1) {
        groupMemberList.splice(index, 1);
      }
      else {
        groupMemberList.push(id);
      }
      // const messages = this.state.messages.slice(0);
      const foundIndex = messages.findIndex(message => message.id === id);
      if (foundIndex > -1) {
        if (messages[foundIndex].isChecked === true) {
          messages[foundIndex].isChecked = false;
          this.setState({ messages });
        }
        else {
          messages[foundIndex].isChecked = true;
          this.setState({ messages });
        }
      }
    }

    filterUser(name) {
      const { userList } = this.state;
      const filteredUserList = userList.filter(user => user.userName.toLowerCase().includes(name));
      this.setState({ filterUserList: filteredUserList });
    }


    handleLeaveChatRoom(leaveChatRoom) {
      const { chatRoomId, memberId, onLeaveGroup } = this.props;
      leaveChatRoom({ variables: { chatRoomID: chatRoomId, memberID: memberId } });
      onLeaveGroup();
    }

    render() {
      const { data } = this.props;
      const {
        receiverName, filterUserList, inputBox, participentList, colors,
      } = this.state;
      const list = filterUserList;
      if (data.loading) return 'loading';
      if (data.error) return 'group info';
      return (
        <div className="group-info row">
          <div className="col-md-12">
            <div style={{ textAlign: 'center', margin: '10px auto' }}>
              <ul className="ul">
                <li>
                  <Mutation mutation={UPDATE_CHAT_ROOM_DETAILS}>
                    {updateChatRoomDetail => (
                      inputBox === true ? <input type="text" onKeyPress={e => this.updateChatRoomName(e, updateChatRoomDetail)} /> : <h4>{receiverName}</h4>
                    )}
                  </Mutation>
                </li>
                <li><i className="fas fa-edit" onClick={() => this.toggleInputBox()} aria-hidden="true" /></li>
              </ul>
            </div>
            {participentList === false
              ? (
                <div className="participent-list">
                  <div className="participent-title">
Participents
                    <span style={{ float: 'right' }}>{data.memberListByChatRoomId.memberCount}</span>
                  </div>
                  <div className="participent-name">
                    <ul>
                      <li>
                        {data.memberListByChatRoomId.members.map((memberList, i) => (
                          <div key={memberList.id}>
                            <ProfileUser userName={memberList.member.userName} changeColor={colors[i % colors.length]} />
                            <div key={memberList.id} className="names">{memberList.member.userName}</div>
                          </div>
                        ))}
                      </li>
                    </ul>
                  </div>
                </div>
              )
              : (
                <div className="add-member-list-box">
                  <SearchUser onFilterUser={this.filterUser} />
                  <Scrollbars>
                    {list.map(user => (
                      <ul className="list ripple" key={user.id}>
                        <li className="clearfix ">
                          <div className="about">
                            <div>
                              <ProfileUser userName={user.userName} />
                              <div className="name " key={user.id} onClick={e => this.addUserToGroupList(e, user.id)} aria-hidden="true">
                                {user.userName}
                                <div className={user.isChecked === true ? 'arraw' : 'check-box'} />
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    ))}
                    <div style={{ textAlign: 'center', margin: '10px auto' }}>
                      <Mutation mutation={NEW_CHAT_ROOM_MEMBER}>
                        {newChatRoomMembers => (
                          <button type="button" style={{ textTransform: 'uppercase' }} className="btn btn-outline-primary btn-md" onClick={e => this.handleAddMember(e, newChatRoomMembers)}>add member</button>
                        )}
                      </Mutation>
                    </div>
                  </Scrollbars>
                </div>
              )}
            <div>
              <div className="row" style={{ textAlign: 'center', margin: '20px auto' }}>
                <button type="button" className="col-md-6 btn btn-md btn-outline-primary" onClick={() => this.addParticipent()}>Add participent</button>
                <Mutation mutation={LEAVE_CHAT_ROOM}>
                  {leaveChatRoom => (
                    <button type="button" className="col-md-6 btn btn-outline-danger btn-md" onClick={() => this.handleLeaveChatRoom(leaveChatRoom)}>Leave chat room</button>
                  )}
                </Mutation>
              </div>
            </div>
          </div>

        </div>
      );
    }
}

export default compose(
  graphql(UPDATE_CHAT_ROOM_DETAILS, { name: 'updateChatRoomDetails' }),
  graphql(NEW_CHAT_ROOM_MEMBER, { name: 'newChatRoomMember' }),
  graphql(MEMBER_LIST_BY_CHATROOM, { options: props => ({ variables: { chatRoomID: props.chatRoomId, memberID: props.memberId } }) }),
  withApollo,
)(GroupInfo);

GroupInfo.propTypes = {
  receiverName: PropTypes.string,
  chatRoomId: PropTypes.string,
  memberId: PropTypes.string,
  onLeaveGroup: PropTypes.func,
  onHandleGroupInfo: PropTypes.func,
  client: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.object, PropTypes.array]),
  data: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.object, PropTypes.array]),
};

GroupInfo.defaultProps = {
  receiverName: PropTypes.string,
  chatRoomId: PropTypes.string,
  memberId: PropTypes.string,
  onLeaveGroup: PropTypes.func,
  onHandleGroupInfo: PropTypes.func,
  client: PropTypes.object,
  data: PropTypes.object,
};
