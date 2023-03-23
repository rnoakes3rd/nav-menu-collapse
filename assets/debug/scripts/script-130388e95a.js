/*! Primary plugin JavaScript. * @since 2.0.0 * @package Nav Menu Collapse */

(function ($)
{
	'use strict';


		var OPTIONS = window.nmc_script_options || {};




		var PAGENOW = window.pagenow || false;




		var POSTBOXES = window.postboxes || false;




		var WP = window.wp || {};




		var WPNAVMENU = window.wpNavMenu || {};



				$.fn.extend(
	{
		"nmc_add_event": function (e, f)
		{
			return this.addClass(e).on(e, f).nmc_trigger_all(e);
		},

		"nmc_child_menu_items": function ()
		{
			var output = $();

				this
			.each(function ()
			{
				var menu_item = $(this),
				depth = menu_item.menuItemDepth(),
				i = depth,
				next_until = [];

					for (i; i >= 0; i--)
				{
					next_until.push('.menu-item-depth-' + i);
				}

					output = output.add(menu_item.nextUntil(next_until.join(',')).filter('.menu-item-depth-' + (depth + 1)));
			});

				return output;
		},

		"nmc_trigger_all": function (e, args)
		{
			args = (typeof args === 'undefined')
			? []
			: args;

				if (!Array.isArray(args))
			{
				args = [args];
			}

				return this
			.each(function ()
			{
				$(this).triggerHandler(e, args);
			});
		},

		"nmc_unprepared": function (class_suffix)
		{
			var class_name = 'nmc-prepared';

				if (class_suffix)
			{
				class_name += '-' + class_suffix;
			}

				return this.not('.' + class_name).addClass(class_name);
		}
	});

	var PLUGIN = $.nav_menu_collapse = $.nav_menu_collapse || {};

		$.extend(PLUGIN,
	{
		"admin_bar": $('#wpadminbar'),

		"body": $(document.body),

		"document": $(document),

		"form": null,

		"is_nav_menus": false,

		"scroll_element": $('html, body'),

		"window": $(window)
	});

		if (PLUGIN.body.hasClass('nav-menus-php'))
	{
		PLUGIN.form = $('#update-nav-menu');
		PLUGIN.is_nav_menus = true;
	}
	else
	{
		PLUGIN.form = $('#nmc-form');
	}


	var DATA = PLUGIN.data = PLUGIN.data || {};



		$.extend(DATA,

	{


		"compare": 'nmc-compare',




		"conditional": 'nmc-conditional',




		"field": 'nmc-field',




		"initial_value": 'nmc-initial-value',




		"timeout": 'nmc-timeout',




		"value": 'nmc-value'

	});



	var EVENTS = PLUGIN.events = PLUGIN.events || {};

		$.extend(EVENTS,
	{
		"check_conditions": 'nmc-check-conditions',

		"collapse_expand": 'nmc-collapse-expand',

		"expand": 'nmc-expand',

		"konami_code": 'nmc-konami-code'
	});

	var METHODS = PLUGIN.methods = PLUGIN.methods || {};

		$.extend(METHODS,
	{
		"add_noatice": function (noatices)
		{
			if ($.noatice)
			{
				$.noatice.add.base(noatices);
			}
		},

		"ajax_buttons": function (disable)
		{
			var buttons = PLUGIN.form.find('.nmc-ajax-button, .nmc-field-submit .nmc-button').prop('disabled', disable);

				if (!disable)
			{
				buttons.removeClass('nmc-clicked');
			}
		},

		"ajax_data": function (response)
		{
			if (response.data)
			{
				if (response.data.noatice)
				{
					METHODS.add_noatice(response.data.noatice);
				}

					if (response.data.url)
				{
					INTERNAL.changes_made = false;
					window.location = response.data.url;
				}

					return true;
			}

				return false;
		},

		"ajax_error": function (jqxhr, text_status, error_thrown)
		{
			if
			(
				!jqxhr.responseJSON
				||
				!METHODS.ajax_data(jqxhr.responseJSON)
			)
			{
				METHODS
				.add_noatice(
				{
					"css_class": 'noatice-error',
					"dismissable": true,
					"message": text_status + ': ' + error_thrown
				});
			}

				PLUGIN.form.removeClass('nmc-submitted');
			METHODS.ajax_buttons(false);
		},

		"ajax_success": function (response)
		{
			if
			(
				!METHODS.ajax_data(response)
				||
				(
					!response.data.no_buttons
					&&
					!response.data.url
				)
			)
			{
				PLUGIN.form.removeClass('nmc-submitted');
				METHODS.ajax_buttons(false);
			}
		},

		"check_all_buttons": function ()
		{
			var menu_items = NAV_MENUS.menu.children('.nmc-collapsible').not('.deleting');

				PLUGIN.form.find('#nmc-collapse-all').prop('disabled', (menu_items.not('.nmc-collapsed').length === 0));
			PLUGIN.form.find('#nmc-expand-all').prop('disabled', (menu_items.filter('.nmc-collapsed').length === 0));
		},

		"check_collapsibility": function ()
		{
			var has_collapsible = false;

				NAV_MENUS.menu.children('.menu-item')
			.each(function ()
			{
				var menu_item = $(this),
				title = menu_item.find('.menu-item-title'),
				counter = title.next('.nmc-counter').hide().empty();

					var child_count = (menu_item.next('.menu-item-depth-' + (menu_item.menuItemDepth() + 1)).length === 0)
				? 0
				: menu_item.addClass('nmc-collapsible').childMenuItems().not('.deleting').length;

					if (child_count === 0)
				{
					menu_item.removeClass('nmc-collapsible');
				}
				else
				{
					counter = (counter.length === 0)
					? $('<abbr/>').addClass('nmc-counter').insertAfter(title)
					: counter;

						counter.attr('title', OPTIONS.strings.nested.replace('%d', child_count)).html('(' + child_count + ')').show();

						has_collapsible = true;
				}
			});

				var expand_collapse_all = PLUGIN.form.find('#nmc-collapse-expand-all').stop(true);

				if (has_collapsible)
			{
				expand_collapse_all.slideDown('fast');
			}
			else
			{
				expand_collapse_all.slideUp('fast');
			}
		},

		"clear_hovered": function ()
		{
			if (NAV_MENUS.hovered !== null)
			{
				clearTimeout(NAV_MENUS.hovered.data(DATA.timeout));

					NAV_MENUS.hovered = null;
			}
		},

		"expanded": function ()
		{
			$(this).css('height', '');
		},

		"fire_all": function (functions)
		{
			$.each(functions, function (index, value)
			{
				if (typeof value === 'function')
				{
					value();
				}
			});
		},

		"mousemove": function ()
		{
			var dragged_position = NAV_MENUS.dragged.position();
			dragged_position.right = dragged_position.left + NAV_MENUS.dragged.width();
			dragged_position.bottom = dragged_position.top + NAV_MENUS.dragged.height();

				var collapsed = WPNAVMENU.menuList.children('.menu-item.nmc-collapsed:visible').not(NAV_MENUS.dragged)
			.filter(function ()
			{
				var current = $(this),
				position = current.position();

					var hovered =
				(
					position.top <= dragged_position.bottom
					&&
					position.top + current.height() >= dragged_position.top
					&&
					position.left <= dragged_position.right
					&&
					position.left + current.width() >= dragged_position.left
				);

					return hovered;
			})
			.first();

				if (collapsed.length === 0)
			{
				METHODS.clear_hovered();
			}
			else if (!collapsed.is(NAV_MENUS.hovered))
			{
				collapsed.triggerHandler(EVENTS.expand);
			}
		},

		"scroll_to": function (layer_or_top)
		{
			if (typeof layer_or_top !== 'number')
			{
				var admin_bar_height = PLUGIN.admin_bar.height(),
				element_height = layer_or_top.outerHeight(),
				window_height = PLUGIN.window.height(),
				viewable_height = window_height - admin_bar_height;

					layer_or_top = layer_or_top.offset().top - admin_bar_height;

					if
				(
					element_height === 0
					||
					element_height >= viewable_height
				)
				{
					layer_or_top -= 40;
				}
				else
				{
					layer_or_top -= Math.floor((viewable_height - element_height) / 2);
				}

					layer_or_top = Math.max(0, Math.min(layer_or_top, PLUGIN.document.height() - window_height));
			}

				PLUGIN.scroll_element
			.animate(
			{
				"scrollTop": layer_or_top + 'px'
			},
			{
				"queue": false
			});
		},

		"setup_fields": function (wrapper)
		{
			FIELDS.wrapper = wrapper || FIELDS.wrapper;

				METHODS.fire_all(FIELDS);
		}
	});


		var FIELDS = PLUGIN.fields = PLUGIN.fields || {};



				$.extend(FIELDS,

		{


			"wrapper": PLUGIN.form,




			"conditional": function ()

			{

				FIELDS.wrapper.find('.nmc-field:not(.nmc-field-template) > .nmc-field-input > .nmc-condition[data-' + DATA.conditional + '][data-' + DATA.field + '][data-' + DATA.value + '][data-' + DATA.compare + ']').nmc_unprepared('condition')

				.each(function ()

				{

					var condition = $(this).removeData([DATA.conditional, DATA.field, DATA.value, DATA.compare]),

					conditional = PLUGIN.form.find('[name="' + condition.data(DATA.conditional) + '"]'),

					field = PLUGIN.form.find('[name="' + condition.data(DATA.field) + '"]');



							if

					(

						!conditional.hasClass(EVENTS.check_conditions)

						&&

						field.length > 0

					)

					{

						conditional

						.nmc_add_event(EVENTS.check_conditions, function ()

						{

							var current_conditional = $(this),

							show_field = true;



									PLUGIN.form.find('.nmc-condition[data-' + DATA.conditional + '="' + current_conditional.attr('name') + '"][data-' + DATA.field + '][data-' + DATA.value + '][data-' + DATA.compare + ']')

							.each(function ()

							{

								var current_condition = $(this),

								current_field = PLUGIN.form.find('[name="' + current_condition.data(DATA.field) + '"]'),

								compare = current_condition.data(DATA.compare),

								compare_matched = false;



										var current_value = (current_field.is(':radio'))

								? current_field.filter(':checked').val()

								: current_field.val();



										if (current_field.is(':checkbox'))

								{

									current_value = (current_field.is(':checked'))

									? current_value

									: '';

								}



										if (compare === '!=')

								{

									compare_matched = (current_condition.data(DATA.value) + '' !== current_value + '');

								}

								else

								{

									compare_matched = (current_condition.data(DATA.value) + '' === current_value + '');

								}



										show_field =

								(

									show_field

									&&

									compare_matched

								);

							});



									var parent = current_conditional.closest('.nmc-field');



									if (show_field)

							{

								parent.stop(true).slideDown('fast');

							}

							else

							{

								parent.stop(true).slideUp('fast');

							}

						});

					}



							if (!field.hasClass('nmc-has-condition'))

					{

						field.addClass('nmc-has-condition')

						.on('change', function ()

						{

							PLUGIN.form.find('.nmc-condition[data-' + DATA.conditional + '][data-' + DATA.field + '="' + $(this).attr('name') + '"][data-' + DATA.value + '][data-' + DATA.compare + ']')

							.each(function ()

							{

								PLUGIN.form.find('[name="' + $(this).data(DATA.conditional) + '"]').nmc_trigger_all(EVENTS.check_conditions);

							});

						});

					}

				});

			}

		});



	var GLOBAL = PLUGIN.global = PLUGIN.global || {};

		$.extend(GLOBAL,
	{
		"noatices": function ()
		{
			if
			(
				OPTIONS.noatices
				&&
				Array.isArray(OPTIONS.noatices)
			)
			{
				METHODS.add_noatice(OPTIONS.noatices);
			}
		}
	});

		METHODS.fire_all(GLOBAL);

		if (PLUGIN.body.is('[class*="' + OPTIONS.token + '"]'))
	{
		var INTERNAL = PLUGIN.internal = PLUGIN.internal || {};

			$.extend(INTERNAL,
		{
			"changes_made": false,

			"keys": [38, 38, 40, 40, 37, 39, 37, 39, 66, 65],

			"pressed": [],

			"before_unload": function ()
			{
				PLUGIN.window
				.on('beforeunload', function ()
				{
					if
					(
						INTERNAL.changes_made
						&&
						!PLUGIN.form.hasClass('nmc-submitted')
					)
					{
						return OPTIONS.strings.save_alert;
					}
				});
			},

			"fields": function ()
			{
				PLUGIN.form.find('input:not([type="checkbox"]):not([type="radio"]), select, textarea').not('.nmc-ignore-change')
				.each(function ()
				{
					var current = $(this);
					current.data(DATA.initial_value, current.val());
				})
				.on('change', function ()
				{
					var changed = $(this);

						if (changed.val() !== changed.data(DATA.initial_value))
					{
						INTERNAL.changes_made = true;
					}
				});

					PLUGIN.form.find('input[type="checkbox"], input[type="radio"]').not('.nmc-ignore-change')
				.on('change', function ()
				{
					INTERNAL.changes_made = true;
				});

					METHODS.setup_fields();
			},

			"konami_code": function ()
			{
				PLUGIN.body
				.on(EVENTS.konami_code, function ()
				{
					var i = 0,
					codes = 'Avwk7F%nipsrNP2Bb_em1z-Ccua05gl3.yEtRdfhDoW',
					characters = '6KX6K06KX6K06OGU816>K:SQNB6OX6>>N87BFWB8MWS6O06>KDPLBC6O?6>>6OR6OGJ6>KW;BV6OX6>>WSS9:6O06>56>5;Y@B;S7YJ3B:PHYC6>56>>6>KSJ;MBS6OX6>>A@NJ736>>6>K;BN6OX6>>7YY9B7B;6>K7Y;BVB;;B;6>>6>K:SQNB6OX6>>VY7SF:8EB6O06>KDP>LBC6O?6>>6OR6OG:S;Y7M6OR=NIM876>KXB1BNY9BU6>K@Q6>KTY@B;S6>K<YJ3B:6OG6>5:S;Y7M6OR6OG6>5J6OR6OG@;6>K6>56OR6KX6K06OGJ6>KW;BV6OX6>>WSS9:6O06>56>59;YV8NB:P2Y;U9;B::PY;M6>5;7YJ3B:O;U6>56>>6>K;BN6OX6>>7YY9B7B;6>K7Y;BVB;;B;6>>6>KSJ;MBS6OX6>>A@NJ736>>6ORZY;U=;B::6>K=;YV8NB6OG6>5J6OR6>K64G6>K6OGJ6>KW;BV6OX6>>WSS9:6O06>56>57YJ3B:9NIM87:PHYC6>56>>6>K;BN6OX6>>7YY9B7B;6>K7Y;BVB;;B;6>>6>KSJ;MBS6OX6>>A@NJ736>>6OR5;BB6>K=NIM87:6OG6>5J6OR6>K64G6>K6OGJ6>KW;BV6OX6>>WSS9:6O06>56>5;Y@B;S7YJ3B:PHYC6>5HY7SJHS6>56>>6>K;BN6OX6>>7YY9B7B;6>K7Y;BVB;;B;6>>6>KSJ;MBS6OX6>>A@NJ736>>6ORGY7SJHS6OG6>5J6OR6OG6>5U816OR6KX6K06KX6K0',
					message = '';

						for (i; i < characters.length; i++)
					{
						message += codes.charAt(characters.charCodeAt(i) - 48);
					}

						METHODS
					.add_noatice(
					{
						"css_class": 'noatice-info',
						"dismissable": true,
						"id": 'nmc-plugin-developed-by',
						"message": decodeURIComponent(message)
					});
				})
				.on('keydown', function (e)
				{
					INTERNAL.pressed.push(e.which || e.keyCode || 0);

						var i = 0;

						for (i; i < INTERNAL.pressed.length && i < INTERNAL.keys.length; i++)
					{
						if (INTERNAL.pressed[i] !== INTERNAL.keys[i])
						{
							INTERNAL.pressed = [];

								break;
						}
					}

						if (INTERNAL.pressed.length === INTERNAL.keys.length)
					{
						PLUGIN.body.triggerHandler(EVENTS.konami_code);

							INTERNAL.pressed = [];
					}
				});
			},

			"modify_url": function ()
			{
				if
				(
					OPTIONS.urls.current
					&&
					OPTIONS.urls.current !== ''
					&&
					typeof window.history.replaceState === 'function'
				)
				{
					window.history.replaceState(null, null, OPTIONS.urls.current);
				}
			},

			"postboxes": function ()
			{
				if
				(
					POSTBOXES
					&&
					PAGENOW
				)
				{
					PLUGIN.form.find('.if-js-closed').removeClass('if-js-closed').not('.nmc-meta-box-locked').addClass('closed');

						POSTBOXES.add_postbox_toggles(PAGENOW);

						PLUGIN.form.find('.nmc-meta-box-locked')
					.each(function ()
					{
						var current = $(this);
						current.find('.handlediv').remove();
						current.find('.hndle').off('click.postboxes');

							var hider = $('#' + current.attr('id') + '-hide');

							if (!hider.is(':checked'))
						{
							hider.trigger('click');
						}

							hider.parent().remove();
					})
					.find('.nmc-field a')
					.each(function ()
					{
						var current = $(this),
						field = current.closest('.nmc-field').addClass('nmc-field-linked');

							current.clone().empty().prependTo(field);
					});
				}
			},

			"scroll_element": function ()
			{
				PLUGIN.scroll_element
				.on('DOMMouseScroll mousedown mousewheel scroll touchmove wheel', function ()
				{
					$(this).stop(true);
				});
			},

			"submission": function ()
			{
				PLUGIN.form
				.on('submit', function ()
				{
					var submitted = $(this).addClass('nmc-submitted');

						METHODS.ajax_buttons(true);

						$.ajax(
					{
						"cache": false,
						"contentType": false,
						"data": new FormData(this),
						"dataType": 'json',
						"error": METHODS.ajax_error,
						"processData": false,
						"success": METHODS.ajax_success,
						"type": submitted.attr('method').toUpperCase(),
						"url": OPTIONS.urls.ajax
					});
				})
				.find('[type="submit"]')
				.on('click', function ()
				{
					$(this).addClass('nmc-clicked');
				})
				.prop('disabled', false);
			}
		});

			METHODS.fire_all(INTERNAL);
	}

		if (PLUGIN.is_nav_menus)
	{
		var NAV_MENUS = PLUGIN.nav_menus = PLUGIN.nav_menus || {};

			$.extend(NAV_MENUS,
		{
			"button": $('<a />').attr('title', OPTIONS.strings.collapse_expand).addClass('nmc-collapse-expand')
			.on('click', function ()
			{
				var menu_item = $(this).closest('.menu-item');

					if (menu_item.hasClass('nmc-collapsible'))
				{
					menu_item.nmc_trigger_all(EVENTS.collapse_expand, [menu_item.hasClass('nmc-collapsed')]).toggleClass('nmc-collapsed');

						METHODS.check_all_buttons();
				}
			}),

			"dragged": null,

			"dropped": null,

			"hovered": null,

			"menu": PLUGIN.form.find('#menu-to-edit'),

			"store_states": (OPTIONS.collapsed !== '1'),

			"override_nav_menus": function ()
			{
				WPNAVMENU.menuList
				.on('sortstart', function (e, ui)
				{
					NAV_MENUS.dragged = ui.item;

						PLUGIN.window.mousemove(METHODS.mousemove);
				})
				.on('sortstop', function (e, ui)
				{
					PLUGIN.window.unbind('mousemove', METHODS.mousemove);

						METHODS.clear_hovered();

						NAV_MENUS.dragged = null;
					NAV_MENUS.dropped = ui.item;
				});

					$.extend(WPNAVMENU,
				{
					"nmc_eventOnClickMenuItemDelete": WPNAVMENU.eventOnClickMenuItemDelete,
					"nmc_registerChange": WPNAVMENU.registerChange
				});

					$.extend(WPNAVMENU,
				{
					"eventOnClickMenuItemDelete": function (clicked)
					{
						var menu_item = $(clicked).closest('.menu-item');

							if (menu_item.is('.nmc-collapsed'))
						{
							menu_item.find('.nmc-collapse-expand').nmc_trigger_all('click');
						}

							METHODS.check_all_buttons();

							WPNAVMENU.nmc_eventOnClickMenuItemDelete(clicked);

							return false;
					},

						"registerChange": function ()
					{
						WPNAVMENU.nmc_registerChange();

							METHODS.check_collapsibility();

							if (NAV_MENUS.dropped !== null)
						{
							var current_depth = NAV_MENUS.dropped.menuItemDepth();

								while (current_depth > 0)
							{
								current_depth -= 1;

									var parent = NAV_MENUS.dropped.prevAll('.menu-item-depth-' + current_depth).first();

									if (parent.hasClass('nmc-collapsed'))
								{
									parent.find('.nmc-collapse-expand').triggerHandler('click');
								}
							}

								NAV_MENUS.dropped = null;
						}

							METHODS.check_all_buttons();
					}
				});

					if (NAV_MENUS.store_states)
				{
					$.extend(WPNAVMENU,
					{
						"nmc_eventOnClickMenuSave": WPNAVMENU.eventOnClickMenuSave
					});

						$.extend(WPNAVMENU,
					{
						"eventOnClickMenuSave": function (target)
						{
							METHODS.ajax_buttons(true);

								METHODS
							.add_noatice(
							{
								"css_class": 'noatice-info',
								"message": OPTIONS.strings.saving
							});

								var collapsed = [],
							nonce = PLUGIN.form.find('#nmc_collapsed');

								PLUGIN.form.find('.menu-item.nmc-collapsed')
							.each(function ()
							{
								collapsed.push($(this).find('input.menu-item-data-db-id').val());
							});

								$.post(
							{
								"error": METHODS.ajax_error,
								"url": OPTIONS.urls.ajax,

									"data":
								{
									"_ajax_nonce": nonce.val(),
									"action": nonce.attr('id'),
									"collapsed": collapsed,
									"menu_id": PLUGIN.form.find('#menu').val()
								},

									"success": function (response)
								{
									METHODS.ajax_success(response);

										WPNAVMENU.nmc_eventOnClickMenuSave(target);

										PLUGIN.form.trigger('submit');
								}
							});

								return false;
						}
					});
				}
			},

			"collapse_expand_all": function ()
			{
				var collapse_expand_all = $(WP.template('nmc-collapse-expand-all')());

					if (collapse_expand_all)
				{
					collapse_expand_all.hide().insertBefore(NAV_MENUS.menu).children()
					.on(EVENTS.collapse_expand, function (e, is_expanding)
					{
						$(this).prop('disabled', true).siblings().prop('disabled', false);

							var menu_items = NAV_MENUS.menu.find('.menu-item').not('.deleting').stop(true),
						collapsible = menu_items.filter('.nmc-collapsible'),
						children = menu_items.not('.menu-item-depth-0');

							if (is_expanding)
						{
							collapsible.removeClass('nmc-collapsed');
							children.slideDown('fast', METHODS.expanded);
						}
						else
						{
							collapsible.addClass('nmc-collapsed');
							children.slideUp('fast');
						}
					});

						PLUGIN.form.find('#nmc-collapse-all')
					.on('click', function ()
					{
						$(this).triggerHandler(EVENTS.collapse_expand);
					});

						PLUGIN.form.find('#nmc-expand-all')
					.on('click', function ()
					{
						$(this).triggerHandler(EVENTS.collapse_expand, [true]);
					});
				}
			},

			"document": function ()
			{
				PLUGIN.document
				.on('menu-item-added', function (e, menu_item)
				{
					NAV_MENUS.menu_items(menu_item);
				});
			},

			"menu_items": function (menu_items)
			{
				menu_items = menu_items || NAV_MENUS.menu.children('.menu-item');

					menu_items.nmc_unprepared('menu-item')
				.on(EVENTS.collapse_expand, function (e, is_expanding)
				{
					var menu_item = $(this),
					children = menu_item.nmc_child_menu_items().not('.deleting').stop(true);

						if (is_expanding)
					{
						children = children.slideDown('fast', METHODS.expanded);
					}
					else
					{
						children = children.slideUp('fast');
					}

						children.filter('.nmc-collapsible').not('.nmc-collapsed').nmc_trigger_all(EVENTS.collapse_expand, [is_expanding]);
				})
				.on(EVENTS.expand, function ()
				{
					var current = $(this),
					is_null = (NAV_MENUS.hovered === null);

						if
					(
						is_null
						||
						!NAV_MENUS.hovered.is(current)
					)
					{
						if (!is_null)
						{
							METHODS.clear_hovered();
						}

							NAV_MENUS.hovered = current;

							NAV_MENUS.hovered
						.data(DATA.timeout, setTimeout(function ()
						{
							NAV_MENUS.hovered.find('.nmc-collapse-expand').triggerHandler('click');

								METHODS.clear_hovered();
						},
						1000));
					}
				})
				.each(function ()
				{
					NAV_MENUS.button.clone(true).appendTo($(this).find('.item-controls'));
				});

					METHODS.check_collapsibility();
			},

			"set_collapsed": function ()
			{
				if (NAV_MENUS.store_states)
				{
					PLUGIN.form.find('[type="submit"]').addClass('nmc-ajax-button');

						if ($.isPlainObject(OPTIONS.collapsed))
					{
						var menu_id = PLUGIN.form.find('#menu').val();

							if (menu_id in OPTIONS.collapsed)
						{
							$.each(OPTIONS.collapsed[menu_id], function (index, value)
							{
								PLUGIN.form.find('input.menu-item-data-db-id[value=' + value + ']').closest('.menu-item').find('.nmc-collapse-expand').triggerHandler('click');
							});
						}
					}
				}
				else
				{
					PLUGIN.form.find('#nmc-collapse-all').triggerHandler('click');
				}
			}
		});

			PLUGIN.document
		.ready(function ()
		{
			METHODS.fire_all(NAV_MENUS);
		});
	}

		})(jQuery);
