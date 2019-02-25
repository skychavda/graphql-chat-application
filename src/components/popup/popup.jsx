import React from 'react';
import './popup.css';

class Popup extends React.Component {
    closePopup(e){
        this.props.onClosePopup(e);
    }

    render() {
        return (
            <div className="popup">
                <div className="popup_inner">
                    <div>
                        <h4 style={{float:'left'}}>Opps!!</h4>
                        <div className="close" onClick={(e) => this.closePopup(e)}>&times;</div>
                    </div>
                    <div className="popup_content">
                        User alerady exists!!
                    </div>
                </div>
            </div>
        );
    }
}

export default Popup;