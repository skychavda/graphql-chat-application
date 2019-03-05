import React from 'react';
import './searchuser.css';

class SearchUser extends React.Component {
  handleUserName(e) {
    this.props.onFilterUser(e.target.value);
  }

  render() {
    return (
      <input type="text" className="search-text-box" onChange={e => this.handleUserName(e)} placeholder="search user..." />
    );
  }
}

export default SearchUser;
