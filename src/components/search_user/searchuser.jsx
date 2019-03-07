import React from 'react';
import PropTypes from 'prop-types';

class SearchUser extends React.Component {
  handleUserName(e) {
    const { onFilterUser } = this.props;
    onFilterUser(e.target.value);
  }

  render() {
    return (
      <input type="text" className="search-text-box" onChange={e => this.handleUserName(e)} placeholder="search user..." />
    );
  }
}

export default SearchUser;

SearchUser.propTypes = {
  onFilterUser: PropTypes.func,
};

SearchUser.defaultProps = {
  onFilterUser: PropTypes.func,
};
