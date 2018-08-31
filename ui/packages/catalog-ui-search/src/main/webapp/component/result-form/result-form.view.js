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
/* global setTimeout */
const Marionette = require('marionette')
const $ = require('jquery')
const template = require('./result-form.hbs')
const CustomElements = require('js/CustomElements')
const store = require('js/store')
const PropertyView = require('component/property/property.view')
const Property = require('component/property/property')
const metacardDefinitions = require('component/singletons/metacard-definitions')
const rearrange = require('../dropdown/attributes-rearrange/dropdown.attributes-rearrange.view')
const DropdownModel = require('component/dropdown/dropdown')
const Loading = require('component/loading-companion/loading-companion.view')
const _ = require('underscore')
const announcement = require('component/announcement')
const ResultFormCollection = require('component/result-form/result-form')
const Common = require('js/Common')
const ResultForm = require('component/search-form/search-form')

module.exports = Marionette.LayoutView.extend({
  template: template,
  tagName: CustomElements.register('result-form'),
  modelEvents: {},
  events: {
    'click .editor-edit': 'edit',
    'click .editor-cancel': 'cancel',
    'click .editor-save': 'save'
  },
  regions: {
    basicTitle: '.basic-text',
    basicDescription: '.basic-description',
    basicAttribute: '.basic-type',
    basicAttributeSpecific: '.basic-type-specific',
    basicRearrange: '.basic-rearrange'
  },
  filter: undefined,
  onBeforeShow: function () {
    this.model = this.model._cloneOf ? store.getQueryById(this.model._cloneOf) : this.model
    this.setupTitleInput()
    this.setupDescription()
    this.setupAttributeSpecific()
    this.setupRearrange()
    this.edit()
  },
  getAttributeSpecific() {
    let currentValue = this.model.get('descriptors') !== {} || this.model.get('descriptors') !== [] ? this.model.get('descriptors') : []
    let startingAttributes = metacardDefinitions.getMetacardStartingTypes();
    let includedAttributes = _.filter(metacardDefinitions.sortedMetacardTypes, function (type) {
      return !metacardDefinitions.isHiddenTypeExceptThumbnail(type.id)
    }).filter(function (type) {
      return !startingAttributes.hasOwnProperty(type.id)
    }).map(function (metacardType) {
      return {
        label: metacardType.alias || metacardType.id,
        value: metacardType.id
      }
    })
    debugger
    return {currentValue, startingAttributes, includedAttributes}
  },
  setupAttributeSpecific: function () {
    let {currentValue,includedAttributes} = this.getAttributeSpecific()
    this.basicAttributeSpecific.show(new PropertyView({
      model: new Property({
        enumFiltering: true,
        showValidationIssues: true,
        enumMulti: true,
        enum:includedAttributes,
        values: this.model.get('descriptors'),
        value: [currentValue],
        id: 'Attributes'
      })
    }))
  },
  setupRearrange: function() {
    let attributes = this.basicAttributeSpecific.currentView.model
    debugger
    this.basicRearrange.show(new rearrange({
      model: new DropdownModel({selectedAttributes: attributes}),
      selectionInterface: this.options.selectionInterface,
    }))
  },
  //const rearrange = require('../dropdown/attributes-rearrange/dropdown.attributes-rearrange.view')


  
  // generateDetailsRearrange: function(){
  //   this.detailsRearrange.show(new AttributesRearrangeView({
  //       model: new DropdownModel(),
        
  //       summary: this.options.summary
  //   }), {
  //       replaceElement: true
  //   })
// },
  setupTitleInput: function () {
    let currentValue = this.model.get('name') ? this.model.get('name') : ''
    this.basicTitle.show(new PropertyView({
      model: new Property({
        value: [currentValue],
        id: 'Title',
        placeholder: 'Result Form Title'
      })
    }))
  },
  setupDescription: function () {
    let currentValue = this.model.get('description') ? this.model.get('description') : ''
    this.basicDescription.show(new PropertyView({
      model: new Property({
        value: [currentValue],
        id: 'Description',
        placeholder: 'Result Form Description'
      })
    }))
  },
  edit: function () {
    this.$el.addClass('is-editing')
    this.regionManager.forEach(function (region) {
      if (region.currentView && region.currentView.turnOnEditing) {
        region.currentView.turnOnEditing()
      }
    })
  },
  cancel: function () {
    this.cleanup()
  },
  save: function () {
    debugger
    let view = this
    Loading.beginLoading(view)
    let descriptors = this.basicAttributeSpecific.currentView.model.get('value')[0]
    let title = this.basicTitle.currentView.model.getValue()[0]
    if(title === '')
    {
      let $validationElement = this.basicTitle.currentView.$el.find('> .property-label .property-validation')
      $validationElement.removeClass('is-hidden').removeClass('is-warning').addClass('is-error')
      $validationElement.attr('title', "Name field cannot be blank")
      Loading.endLoading(view)
      return 
    }
    let description = this.basicDescription.currentView.model.getValue()[0]
    let id = this.model.get('id')

    this.model.set({
      'descriptors': descriptors.flatten(),
      'title': title,
      'description': description
    })

    this.updateResults()
  },
  updateResults: function () {
    let resultEndpoint = `/search/catalog/internal/forms/result`
    var _this = this;
    $.ajax({
      url: resultEndpoint,
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      type: 'PUT',
      data: JSON.stringify(_this.model.toJSON()),
      context: this,
      success: function (data) {
        ResultFormCollection.getResultCollection().filteredList = _.filter(ResultFormCollection.getResultCollection().filteredList, function(template) {
          return template.id !== _this.model.get('id')
        })
        ResultFormCollection.getResultCollection().filteredList.push({
            id: _this.model.get('id'),
            label: _this.model.get('title'),
            value: _this.model.get('title'),
            type: 'result',
            descriptors: _this.model.get('descriptors'),
            description: _this.model.get('description'),
            accessGroups: _this.model.get('accessGroups'),
            accessIndividuals: _this.model.get('accessIndividual')
          })
          ResultFormCollection.getResultCollection().toggleUpdate()
          _this.cleanup()
      },
      error: _this.cleanup()
    })
  },
  message: function(title, message, type) {
    announcement.announce({
        title: title,
        message: message,
        type: type
    });
},
  cleanup: function () {
    this.$el.trigger(CustomElements.getNamespace() + 'close-lightbox')
    Loading.endLoading(this)
  }
})
