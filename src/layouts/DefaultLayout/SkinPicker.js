import React, { PureComponent } from 'react';
import $ from "jquery";
import { inject } from '../../services/injector-service';

class SkinPicker extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "CacheService");
        this.selectedSkin = this.$cache.get('skin', true) || 'skin-blue';
    }

    componentDidMount() {
        $(`#divSkins [skin="${this.selectedSkin}"]`).addClass("selected");
    }

    skinSelected = (e) => {
        const div = $(e.currentTarget);
        const skin = div.attr("skin");
        this.setSkin(skin);
        $('#divSkins .selected').removeClass('selected');
        div.addClass('selected');
    }

    setSkin(skin) {
        const passedSkin = skin;
        if (this.selectedSkin === skin) {
            return;
        }
        const body = $('body');
        body.removeClass(this.selectedSkin);
        this.skinClass = passedSkin;
        this.selectedSkin = skin;
        this.$cache.set('skin', skin, false, true);
        body.addClass(this.selectedSkin);
    }

    render() {
        return (
            <div className="skin-items" id="divSkins">
                <div title="blue" skin="skin-blue" onClick={this.skinSelected} style={{ borderColor: '#367fa9', backgroundColor: '#3c8dbc' }}>B</div>
                <div title="purple" skin="skin-purple" onClick={this.skinSelected} style={{ borderColor: '#555299', backgroundColor: '#605ca8' }}>P</div>
                <div title="violet" skin="skin-violet" onClick={this.skinSelected} style={{ borderColor: '#7a4889', backgroundColor: '#9055A2' }}>V</div>
                <div title="sea" skin="skin-sea" onClick={this.skinSelected} style={{ borderColor: '#2d7776', backgroundColor: '#379392' }}>S</div>
                <div title="green" skin="skin-green" onClick={this.skinSelected} style={{ borderColor: '#008d4c', backgroundColor: '#00a65a' }}>G</div>
                <div title="green" skin="skin-green2" onClick={this.skinSelected} style={{ borderColor: '#2b954b', backgroundColor: '#33b35a' }}>G</div>
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
                {/*<div onClick={() => this.setSkin('skin-cust1')} style={{ borderColor: '#44318d', backgroundColor: '#e98074' }}>B</div>*/}
                {/*<div onClick={() => this.setSkin('skin-navy')} style={{ borderColor: '#0c0032', backgroundColor: '#190061' }}>B</div>
                <div onClick={() => this.setSkin('skin-blue3')} style={{ borderColor: '#240090', backgroundColor: '#3500d3' }}>B</div>
                <div onClick={() => this.setSkin('skin-cust6')} style={{ borderColor: '#2e1114', backgroundColor: '#501b1d' }}>M</div>
                <div onClick={() => this.setSkin('skin-cust7')} style={{ borderColor: '#2e151b', backgroundColor: '#da7b93' }}>M</div>*/}
            </div>
        );
    }
}

SkinPicker.propTypes = {

};

export default SkinPicker;