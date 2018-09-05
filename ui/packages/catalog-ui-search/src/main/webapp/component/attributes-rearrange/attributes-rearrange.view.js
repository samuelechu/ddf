/**
 * Copyright (c) Codice Foundation
 *
 * This is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details. A copy of the GNU Lesser General Public License
 * is distributed along with this program and can be found at
 * <http://www.gnu.org/licenses/lgpl.html>.
 *
 **/
/*global require*/
var wreqr = require('wreqr');
var _ = require('underscore');
var template = require('./attributes-rearrange.hbs');
var Marionette = require('marionette');
var CustomElements = require('js/CustomElements');
var Common = require('js/Common');
var user = require('component/singletons/user-instance');
var properties = require('properties');
var Sortable = require('sortablejs');
var metacardDefinitions = require('component/singletons/metacard-definitions');

module.exports = Marionette.ItemView.extend({
    template: template,
    tagName: CustomElements.register('attributes-rearrange'),
    initialize: function (options) { 
        debugger
        this.listenTo(user.get('user').get('preferences'), 'change:inspector-summaryShown', this.render);
        this.listenTo(user.get('user').get('preferences'), 'change:inspector-detailsHidden', this.render);
        this.listenTo(this.options.model.attributes.selectedAttributes, 'change:value', this.render);
    },
    
    getSelectedAttributesModel: (model) => (model.attributes.selectedAttributes),

    getPreferredOrder: function () {
        if (this.options.summary) {
            var usersShown = user.get('user').get('preferences').get('inspector-summaryShown');
            var usersOrder = user.get('user').get('preferences').get('inspector-summaryOrder');
            if (usersOrder.length > 0) {
                return usersOrder;
            } else {
                return properties.summaryShow;
            }
        } else {
            return user.get('user').get('preferences').get('inspector-detailsOrder');
        }
    },
    getNewAttributes: function(){
        if (this.options.summary) {
            var usersShown = user.get('user').get('preferences').get('inspector-summaryShown');
            var usersOrder = user.get('user').get('preferences').get('inspector-summaryOrder');
            if (usersShown.length > 0 || usersOrder.length > 0) {
                return usersShown.filter(function(attr){
                    return usersOrder.indexOf(attr) === -1;
                });
            } else {
                return [];
            }
        } else {
            var detailsOrder = user.get('user').get('preferences').get('inspector-detailsOrder');
            return calculateAvailableAttributesFromSelection(this.getSelectedAttributes(this.options.model)).filter(function(attr){
                return detailsOrder.indexOf(attr) === -1;
            });
        }
    },
    serializeData: function () {
        //var preferredHeader = this.getPreferredOrder();
        // var newAttributes = this.getNewAttributes();
        // newAttributes.sort(function(a, b){
        //     return metacardDefinitions.attributeComparator(a,b);
        // });
        //var hidden = this.getHidden();
        debugger
        var availableAttributes = this.getSelectedAttributesModel(this.options.model).attributes.value[0];

        //var z = _.union(preferredHeader, availableAttributes).map(function (property) {
        var z = availableAttributes.map(function(property) {
            return {
                label: properties.attributeAliases[property],
                id: property,
                hidden: false,
                notCurrentlyAvailable: //(availableAttributes.indexOf(property) === -1) ||
                    (properties.isHidden(property)) || metacardDefinitions.isHiddenTypeExceptThumbnail(property)
            };
        });
        return z
    },
    onRender: function () {
        const currentOrdering = this.getSelectedAttributesModel(this.options.model)
        Sortable.create(this.el, {
            onEnd: () => {
                debugger
                // const newOrder = Array.from(this.el.children, child => child.getAttribute("data-propertyid"))
                // currentOrdering.set('value', [newOrder])
                this.handleSave();
            }
        });
    },
    handleSave: function () {
        var prefs = user.get('user').get('preferences');
        var key = this.options.summary ? 'inspector-summaryOrder' : 'inspector-detailsOrder';
        prefs.set(key, _.map(this.$el.find('.column'), (function (element) {
            return element.getAttribute('data-propertyid');
        })));
        prefs.savePreferences();
    }
});