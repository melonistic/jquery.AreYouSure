/*!
 * jQuery Plugin: Are-You-Sure (Dirty Form Detection)
 * https://github.com/codedance/jquery.AreYouSure/
 *
 * Copyright (c) 2012-2014, Chris Dance and PaperCut Software http://www.papercut.com/
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Author:  chris.dance@papercut.com
 * Version: 1.9.0
 * Date:    13th August 2014
 */
(function($) {
  
  $.fn.areYouSure = function(options) {

    const settings = $.extend(
        {
          'message': 'You have unsaved changes!',
          'dirtyClass': 'dirty',
          'change': null,
          'silent': false,
          'addRemoveFieldsMarksDirty': false,
          'fieldEvents': 'change keyup propertychange input',
          'fieldSelector': ":input:not(input[type=submit]):not(input[type=button])"
        }, options);

    const getValue = function($field) {
      if ($field.hasClass('ays-ignore')
          || $field.hasClass('aysIgnore')
          || $field.attr('data-ays-ignore')
          || $field.attr('name') === undefined) {
        return null;
      }

      if ($field.is(':disabled')) {
        return 'ays-disabled';
      }

      let val;
      let type = $field.attr('type');
      if ($field.is('select')) {
        type = 'select';
      }

      switch (type) {
        case 'checkbox':
        case 'radio':
          val = $field.is(':checked');
          break;
        case 'select':
          val = '';
          $field.find('option').each(function(o) {
            const $option = $(this);
            if ($option.is(':selected')) {
              val += $option.val();
            }
          });
          break;
        default:
          val = $field.val();
      }

      return val;
    };

    const storeOrigValue = function($field) {
      $field.data('ays-orig', getValue($field));
    };

    const checkForm = function(evt) {

      const isFieldDirty = function($field) {
        const origValue = $field.data('ays-orig');
        if (undefined === origValue) {
          return false;
        }
        return (getValue($field) != origValue);
      };

      const $form = ($(this).is('form'))
                    ? $(this)
                    : $(this).parents('form');

      // Test on the target first as it's the most likely to be dirty
      if (isFieldDirty($(evt.target))) {
        setDirtyStatus($form, true);
        return;
      }

      let $fields = $form.find(settings.fieldSelector);

      if (settings.addRemoveFieldsMarksDirty) {              
        // Check if field count has changed
        const origCount = $form.data("ays-orig-field-count");
        if (origCount != $fields.length) {
          setDirtyStatus($form, true);
          return;
        }
      }

      // Brute force - check each field
      let isDirty = false;
      $fields.each(function() {
        const $field = $(this);
        if (isFieldDirty($field)) {
          isDirty = true;
          return false; // break
        }
      });
      
      setDirtyStatus($form, isDirty);
    };

    const initForm = function($form) {
      const fields = $form.find(settings.fieldSelector);
      $(fields).each(function() { storeOrigValue($(this)); });
      $(fields).unbind(settings.fieldEvents, checkForm);
      $(fields).bind(settings.fieldEvents, checkForm);
      $form.data("ays-orig-field-count", $(fields).length);
      setDirtyStatus($form, false);
    };

    const setDirtyStatus = function($form, isDirty) {
      const changed = (isDirty !== $form.hasClass(settings.dirtyClass));
      $form.toggleClass(settings.dirtyClass, isDirty);

      // Fire change event if required
      if (changed) {
        if (settings.change) settings.change.call($form, $form);
        const event = ((isDirty) ? 'dirty.areYouSure' : 'clean.areYouSure');
        $form.trigger(event, [$form]);
        $form.trigger('change.areYouSure', [$form]);
      }
    };

    const rescan = function () {
      const $form = $(this);
      const fields = $form.find(settings.fieldSelector);
      $(fields).each(function () {
        const $field = $(this);
        if (!$field.data('ays-orig')) {
          storeOrigValue($field);
          $field.bind(settings.fieldEvents, checkForm);
        }
      });
      // Check for changes while we're here
      $form.trigger('checkform.areYouSure');
    };

    const reinitialize = function() {
      initForm($(this));
    };

/*    if (!settings.silent && !window.aysUnloadSet) {
      window.aysUnloadSet = true;
      $(window).bind('beforeunload', function() {
        $dirtyForms = $("form").filter('.' + settings.dirtyClass);
        if ($dirtyForms.length == 0) {
          return;
        }
        // Prevent multiple prompts - seen on Chrome and IE
        if (navigator.userAgent.toLowerCase().match(/msie|chrome/)) {
          if (window.aysHasPrompted) {
            return;
          }
          window.aysHasPrompted = true;
          window.setTimeout(function() {window.aysHasPrompted = false;}, 900);
        }
        return settings.message;
      });
    }*/

    //TODO When the nav bar is redesigned, change these selector to 'navigable'. Perhaps, consider a parent selector.
    $('body').find('a').on('click', '.navigable', function(event) {
      if ($("form").filter('.dirty').length > 0) unsavedChangesDialog(event, this.href);
    });

    const unsavedChangesDialog = function(event, intendedDestinationHref) {
      event.preventDefault();
      // Selector of location of dialog
      return $('#dialog-confirm-unsaved-changes').dialog({
        resizable: false,
        height: 'auto',
        modal: true,
        buttons: {
          'Stay on Page': function() {
            $(this).dialog('close');
            return false;
          },
          'Leave page': function() {
            $(this).dialog('close');
            return window.location.href = intendedDestinationHref;
          }
        },
        position: {
          my: "top",
          at: "top+150",
          of: window,
          collision: "fit"
        }
      });
    };

    return this.each(function(elem) {
      if (!$(this).is('form')) {
        return;
      }
      var $form = $(this);
        
      $form.submit(function() {
        $form.removeClass(settings.dirtyClass);
      });
      $form.on('reset', function() { setDirtyStatus($form, false); });
      // Add a custom events
      $form.on('rescan.areYouSure', rescan);
      $form.on('reinitialize.areYouSure', reinitialize);
      $form.on('checkform.areYouSure', checkForm);
      initForm($form);
    });
  };
})(jQuery);
