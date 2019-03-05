import React from 'react';
import './profileuser.css';

let i = 0;

class ProfileUser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      colors: ['#bccad6', '#8d9db6', '#667292', '#f1e3dd', '#cfe0e8', '#b7d7e8', '#87bdd8', '#daebe8'],
    };
  }

  componentDidMount() {
    this.extractFirstName();
    this.getColor();
  }

  extractFirstName() {
    const data = this.props.userName;
    let firstName;
    if (data === null) {
      firstName = null;
    }
    else {
      firstName = data.charAt(0);
    }

    return firstName;
  }

  getColor() {
    const { colors } = this.state;
    while (i !== 8) {
      const element = colors[i];
      i++;
      if (i === 7) {
        i = 0;
      }
      return element;
    }
  }

  render() {
    return (
      <div id="profileImage" style={{ backgroundColor: this.getColor() }}>
        {' '}
        {this.extractFirstName()}
      </div>
    );
  }
}

export default ProfileUser;
