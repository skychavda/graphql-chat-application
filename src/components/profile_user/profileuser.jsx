import React from 'react';
import PropTypes from 'prop-types';

class ProfileUser extends React.Component {
  componentDidMount() {
    this.extractFirstName();
  }

  extractFirstName() {
    const { userName } = this.props;
    const data = userName;
    let firstName;
    if (data === null) {
      firstName = null;
    }
    else {
      firstName = data.charAt(0);
    }

    return firstName.toUpperCase();
  }

  render() {
    const { changeColor } = this.props;
    return (
      <div id="profileImage" style={{ backgroundColor: changeColor }}>
        {this.extractFirstName()}
      </div>
    );
  }
}

export default ProfileUser;

ProfileUser.propTypes = {
  userName: PropTypes.string,
  changeColor: PropTypes.string,
};

ProfileUser.defaultProps = {
  userName: PropTypes.string,
  changeColor: PropTypes.string,
};
