import React from 'react';
import gql from 'graphql-tag';
import { Mutation, compose, withApollo } from "react-apollo";
import graphql from 'graphql-anywhere';

const MEMBER_LIST_BY_CHATROOM = gql`
    query memberListByChatRoomId($chatRoomID:ID!, $memberID:ID!){
    memberListByChatRoomId(chatRoomID:$chatRoomID,memberID:$memberID){
        id
        member{
            id
            userName
        }
        chatRoomID
        joinAt
    }
}
`;

class GroupInfo extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            memberList: []
        }
        this.fetchMemberFromQuery = this.fetchMemberFromQuery.bind(this);
    }

    componentDidMount(){
        this.fetchMemberFromQuery();
    }

    fetchMemberFromQuery = async ()=> {
        const {client} = this.props;
        const result = await client.query({
            query: MEMBER_LIST_BY_CHATROOM,
            variables:{
                chatRoomID: this.props.chatRoomID, memberID: this.props.memberID
            }
        })
        // console.log('Line ---- 41',result.data.memberListByChatRoomId);
        this.setState({ memberList: result.data.memberListByChatRoomId })
    }

    render(){
        const memberList = this.state.memberList;
        return(
            <div>
                {memberList.map((list,i)=>(
                    <p key={i}>{list.member.userName}</p>
                ))}
            </div>
        );
    }
}

export default compose(withApollo)(GroupInfo);