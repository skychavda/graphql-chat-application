import React from 'react';
import PropTypes from 'prop-types';

class Popup extends React.Component {
  closePopup(e) {
    const { onClosePopup } = this.props;
    onClosePopup(e);
  }

  render() {
    const { errorMessage } = this.props;
    return (
      <div className="popup">
        <div className="popup_inner">
          <div>
            <h4 style={{ float: 'left' }}>Opps!!</h4>
            <div className="close" onClick={e => this.closePopup(e)} aria-hidden="true">&times;</div>
          </div>
          <div className="popup_content">
            {errorMessage === '' ? 'User alerady exists!!' : errorMessage}
          </div>
        </div>
      </div>
    );
  }
}

export default Popup;

Popup.propTypes = {
  errorMessage: PropTypes.string,
  onClosePopup: PropTypes.func,
};

Popup.defaultProps = {
  errorMessage: PropTypes.string,
  onClosePopup: PropTypes.func,
};
