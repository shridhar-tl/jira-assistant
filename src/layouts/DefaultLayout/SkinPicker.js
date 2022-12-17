import React, { PureComponent } from 'react';
import { inject } from '../../services/injector-service';
import { EventCategory } from '../../constants/settings';

class SkinPicker extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "SettingsService", "AnalyticsService");
    }

    async componentDidMount() {
        this.selectedSkin = await this.$settings.get('skin') || 'skin-blue';
        document.body.querySelector(`#divSkins [skin="${this.selectedSkin}"]`)?.classList?.add('selected');
    }

    skinSelected = (e) => {
        const div = e.currentTarget;
        const skin = div.attributes["skin"].value;
        this.setSkin(skin);
        document.body.querySelector('#divSkins .selected').classList.remove('selected');
        div.classList.add('selected');
    };

    setSkin(skin) {
        const passedSkin = skin;
        if (this.selectedSkin === skin) {
            return;
        }
        const body = document.body.classList;
        body.remove(this.selectedSkin);
        this.skinClass = passedSkin;
        this.selectedSkin = skin;
        this.$settings.set('skin', skin);
        body.add(this.selectedSkin);
        this.$analytics.trackEvent("Skin changed", EventCategory.HeaderActions, skin);
    }

    render() {
        return (
            <div className="skin-items" id="divSkins">
                <div title="blue" skin="skin-blue" onClick={this.skinSelected} style={{ borderColor: '#367fa9', backgroundColor: '#3c8dbc' }}>B</div>
                <div title="purple" skin="skin-purple" onClick={this.skinSelected} style={{ borderColor: '#555299', backgroundColor: '#605ca8' }}>P</div>
                <div title="violet" skin="skin-violet" onClick={this.skinSelected} style={{ borderColor: '#7a4889', backgroundColor: '#9055A2' }}>V</div>
                <div title="sea" skin="skin-sea" onClick={this.skinSelected} style={{ borderColor: '#2d7776', backgroundColor: '#379392' }}>S</div>
                <div title="green" skin="skin-green" onClick={this.skinSelected} style={{ borderColor: '#008d4c', backgroundColor: '#00a65a' }}>G</div>
                <div title="red" skin="skin-red" onClick={this.skinSelected} style={{ borderColor: '#d73925', backgroundColor: '#dd4b39' }}>R</div>
                <div title="yellow" skin="skin-yellow" onClick={this.skinSelected} style={{ borderColor: '#e08e0b', backgroundColor: '#f39c12' }}>Y</div>
                <div title="pink" skin="skin-pink" onClick={this.skinSelected} style={{ borderColor: '#ec2f6c', backgroundColor: '#ef5285' }}>P</div>
                <div title="meadow" skin="skin-meadow" onClick={this.skinSelected} style={{ borderColor: '#1caf9a', backgroundColor: '#8cc1a2' }}>M</div>
                <div skin="skin-blue2" onClick={this.skinSelected} style={{ borderColor: '#557a95', backgroundColor: '#7395ae' }}>B</div>
                <div skin="skin-cust8" onClick={this.skinSelected} style={{ borderColor: '#64485c', backgroundColor: '#83677b' }}>M</div>
                <div skin="skin-green3" onClick={this.skinSelected} style={{ borderColor: '#40561a', backgroundColor: '#729a2e' }}>B</div>
                <div skin="skin-cust2" onClick={this.skinSelected} style={{ borderColor: '#5d5c61', backgroundColor: '#379683' }}>G</div>
                <div skin="skin-cust5" onClick={this.skinSelected} style={{ borderColor: '#7e685a', backgroundColor: '#afd275' }}>G</div>
                <div skin="skin-cust3" onClick={this.skinSelected} style={{ borderColor: '#ffe400', backgroundColor: '#747474' }}>G</div>
                <div title="dark" skin="skin-dark" onClick={this.skinSelected} style={{ borderColor: 'rgba(0,0,0,0.2)', backgroundColor: '#2f353a' }}>D</div>
            </div>
        );
    }
}

SkinPicker.propTypes = {

};

export default SkinPicker;