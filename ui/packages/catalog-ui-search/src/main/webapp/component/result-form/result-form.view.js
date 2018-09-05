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
const ResultFormCollection = require('component/singletons/result-form.collection-instance.js')
const Common = require('js/Common')
const ResultForm = require('component/search-form/search-form')



// module.exports = Marionette.LayoutView.extend({
//   template: template,
//   tagName: CustomElements.register('result-form-collection'),
//   regions: {
//     collectionView: '.collection'
//   },
//   initialize: function() {
//    this.resultFormCollection = ResultForm.getResultCollection();
//    this.listenTo(this.resultFormCollection, 'change:doneLoading', this.handleLoadingSpinner);
//  },


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
    attributeSelect: '.attribute-select',
    summaryAttributeSelect: '.summary-attribute-select',
    attributeRearrange: '.attribute-rearrange'
  },
  intialize: function() {
  },
  filter: undefined,
  onBeforeShow: function() {
    this.model = this.model._cloneOf ? store.getQueryById(this.model._cloneOf) : this.model
    this.setupTitleInput()
    this.setupDescription()
    this.setupAttributeSelect()
    this.setupSummaryAttributeSelect()
    this.setupAttributeRearrange()
    this.edit()
    this.listenTo(this.attributeSelect.currentView.model, 'change:value', this.updateSummaryAttributeSelect)
 
    
  },
  getSelectedAttributesForModel: (/*use a Property model*/ model) => (model.get('value')[0]),
  getSelectedAttributes() {
    const currentValue = this.model.get('descriptors') !== {} || this.model.get('descriptors') !== [] ? this.model.get('descriptors') : []
    const startingAttributes = metacardDefinitions.getMetacardStartingTypes();
    const includedAttributes = _.filter(metacardDefinitions.sortedMetacardTypes, function (type) {
      return !metacardDefinitions.isHiddenTypeExceptThumbnail(type.id)
    }).filter(function (type) {
      return !startingAttributes.hasOwnProperty(type.id)
    }).map(function (metacardType) {
      return {
        label: metacardType.alias || metacardType.id,
        value: metacardType.id
      }
    })
    return {currentValue, startingAttributes, includedAttributes}
  },
  setupAttributeSelect: function () {
    const {currentValue,includedAttributes} = this.getSelectedAttributes()
    this.attributeSelect.show(new PropertyView({
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
  setupSummaryAttributeSelect: function () {
    const {currentValue: selectedAttributes} = this.getSelectedAttributes()
    this.summaryAttributeSelect.show(new PropertyView({
      model: new Property({
        enumFiltering: true,
        showValidationIssues: true,
        enumMulti: true,
        enum: selectedAttributes,
        values: this.model.get('descriptors'),
        value: [[]],
        id: 'Summary Attributes'
      })
    }))
  },
  setupAttributeRearrange: function() {
    const attributes = this.attributeSelect.currentView.model
    this.attributeRearrange.show(new rearrange({
      model: new DropdownModel({selectedAttributes: attributes}),
      selectionInterface: this.options.selectionInterface,
    }))
  },
  setupTitleInput: function () {
    const currentValue = this.model.get('name') ? this.model.get('name') : ''
    this.basicTitle.show(new PropertyView({
      model: new Property({
        value: [currentValue],
        id: 'Title',
        placeholder: 'Result Form Title'
      })
    }))
  },
  setupDescription: function () {
    const currentValue = this.model.get('description') ? this.model.get('description') : ''
    this.basicDescription.show(new PropertyView({
      model: new Property({
        value: [currentValue],
        id: 'Description',
        placeholder: 'Result Form Description'
      })
    }))
  }, 
  updateSummaryAttributeSelect: function() {
    const attributeSelectModel = this.attributeSelect.currentView.model
    const summaryAttributeSelectModel = this.summaryAttributeSelect.currentView.model
    const availableSummaryAttributes = this.getSelectedAttributesForModel(summaryAttributeSelectModel).filter(attribute => {
      return attributeSelectModel.get('value')[0].includes(attribute)
    })
    this.summaryAttributeSelect.show(new PropertyView({
      model: new Property({
        ...summaryAttributeSelectModel.attributes,
        enum: attributeSelectModel.get('value')[0],
        value: [availableSummaryAttributes]
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
    const view = this
    Loading.beginLoading(view)
    const selectedAttributes = this.attributeSelect.currentView.model.get('value')[0]
    const selectedSummaryAttributes = this.summaryAttributeSelect.currentView
    
    const title = this.basicTitle.currentView.model.getValue()[0]
    if(title === '')
    {
      const $validationElement = this.basicTitle.currentView.$el.find('> .property-label .property-validation')
      $validationElement.removeClass('is-hidden').removeClass('is-warning').addClass('is-error')
      $validationElement.attr('title', "Name field cannot be blank")
      Loading.endLoading(view)
      return 
    }
    const description = this.basicDescription.currentView.model.getValue()[0]
    const id = this.model.get('id')

    this.model.set({
      'descriptors': selectedAttributes.flatten(),
      'title': title,
      'description': description
    })

    this.updateResults()
  },
  updateResults: function () {
    const resultEndpoint = `/search/catalog/internal/forms/result`
    var _this = this;
    $.ajax({
      url: resultEndpoint,
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      type: 'PUT',
      data: JSON.stringify(_this.model.toJSON()),
      context: this,
      success: function (data) {
        ResultFormCollection.filteredList = _.filter(ResultFormCollection.filteredList, function(template) {
          return template.id !== _this.model.get('id')
        })
        ResultFormCollection.filteredList.push({
            id: _this.model.get('id'),
            label: _this.model.get('title'),
            value: _this.model.get('title'),
            type: 'result',
            descriptors: _this.model.get('descriptors'),
            description: _this.model.get('description'),
            accessGroups: _this.model.get('accessGroups'),
            accessIndividuals: _this.model.get('accessIndividual')
          })
          ResultFormCollection.toggleUpdate()
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
