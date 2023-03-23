<?php
/*!
 * Nav menus functionality.
 *
 * @since 2.0.0
 *
 * @package    Nav Menu Collapse
 * @subpackage Nav Menus
 */

if (!defined('ABSPATH'))
{
	exit;
}

/**
 * Class used to implement the nav menus functionality.
 *
 * @since 2.0.0
 *
 * @uses Nav_Menu_Collapse_Wrapper
 */
final class Nav_Menu_Collapse_Nav_Menus extends Nav_Menu_Collapse_Wrapper
{
	/**
	 * Constructor function.
	 *
	 * @since 2.0.0
	 *
	 * @access public
	 * @return void
	 */
	public function __construct()
	{
		parent::__construct();

		add_action('load-nav-menus.php', array($this, 'load_nav_menus'));
	}

	/**
	 * Load nav menus page functionality.
	 * 
	 * @since 2.1.2 Removed PHP_INT_MAX reference.
	 * @since 2.1.0 Changed hook priority.
	 * @since 2.0.0
	 * 
	 * @access public
	 * @return void
	 */
	public function load_nav_menus()
	{
		add_action('admin_enqueue_scripts', array('Nav_Menu_Collapse_Global', 'admin_enqueue_scripts'), 9999999);
		add_action('admin_footer', array($this, 'admin_footer'));
		
		Nav_Menu_Collapse_Help::output('nav-menus', false);
	}

	/**
	 * Include the collapse/expand all template.
	 *
	 * @since 2.0.0
	 *
	 * @access public
	 * @return void
	 */
	public function admin_footer()
	{
		ob_start();

		require(dirname(__FILE__) . '/../templates/collapse-expand-all.php');

		echo Nav_Menu_Collapse_Utilities::clean_code(ob_get_clean());
	}
}
