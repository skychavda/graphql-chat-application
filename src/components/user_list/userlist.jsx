import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { Mutation, compose, graphql, withApollo } from "react-apollo";
import ProfileUser from '../profile_user/profileuser';

class UserList extends React.Component {
    render() {
        const list = this.props.list;
        return (
            <div className="user-list">
                <Scrollbars>
                    {list.map((user, i) => (
                        <ul className="list" key={i} >
                            {/* + (user.name === this.state.receiverName ? "user-name-active" : "") */}
                            <li className={"clearfix "}>
                                <div className="about">
                                    {/* <Mutation mutation={INITIAL_CHAT}>
                                        {userChat => ( */}
                                            <div>
                                                <ProfileUser userName={user.userName} />
                                                <div className={"name "} key={user.id} onClick={() => this.initializeChat(user.userName)}>{user.userName}</div>
                                            </div>
                                        {/* )}
                                    </Mutation> */}
                                </div>
                            </li>
                        </ul>
                    ))}
                </Scrollbars>
            </div>
        );
    }
}

export default compose(withApollo)(UserList);