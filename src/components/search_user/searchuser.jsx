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
            
                <input type="text" className="text-box" onChange={(e) => this.handleUserName(e)} />
            
        );
    }
}

export default SearchUser;