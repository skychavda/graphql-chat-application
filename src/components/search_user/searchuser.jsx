import React from 'react';

class SearchUser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filterUser: []
        }
    }

    handleUserName(e) {
        this.props.onFilterUser(e.target.value);
    }

    render() {
        return (
            <div>
                <input type="text" onChange={(e) => this.handleUserName(e)} />
            </div>
        );
    }
}

export default SearchUser;