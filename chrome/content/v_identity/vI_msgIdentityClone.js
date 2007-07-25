/* ***** BEGIN LICENSE BLOCK *****
    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

    The Original Code is the Virtual Identity Extension.

    The Initial Developer of the Original Code is Rene Ejury.
    Portions created by the Initial Developer are Copyright (C) 2007
    the Initial Developer. All Rights Reserved.

    Contributor(s): Thunderbird Developers
 * ***** END LICENSE BLOCK ***** */

vI_msgIdentityClone = {
	icon_usualId_class : "identity_clone-menulist person-icon",
	icon_virtualId_class : "identity_clone-menulist person-icon new-icon",
	text_usualId_class : "plain menulist_clone-textbox",
	text_virtualId_class : "plain menulist_clone-textbox vIactiv",
	
	elements : {
		Obj_MsgIdentity : null,
		Obj_MsgIdentityPopup : null,
		Obj_MsgIdentity_clone : null,
		Obj_MsgIdentityPopup_clone : null,
		Obj_MsgIdentityTextbox_clone : null
	},
	
	init : function() {
		vI_msgIdentityClone.elements.Obj_MsgIdentity = document.getElementById("msgIdentity");
		vI_msgIdentityClone.elements.Obj_MsgIdentityPopup = document.getElementById("msgIdentityPopup");
		vI_msgIdentityClone.elements.Obj_MsgIdentity_clone = document.getElementById("msgIdentity_clone");
		vI_msgIdentityClone.elements.Obj_MsgIdentityPopup_clone = document.getElementById("msgIdentityPopup_clone");
		vI_msgIdentityClone.clone_Obj_MsgIdentity();
	},
	
	// double the Identity-Select Dropdown-Menu
	// if you 'created' a virtual Identity and you close the extension area, the Virtual Identity shows up in the
	// Identity-Dropdown Menu.
	// problem is that there is not yet a existent Identity stored in any account for it, and other Code might
	// access the Dropdown-Menu to know which Identity is selected. So show and change only a clone of the real one.
	clone_Obj_MsgIdentity : function() {
		MenuItems = vI_msgIdentityClone.elements.Obj_MsgIdentityPopup.childNodes
		for (index = 0; index < MenuItems.length; index++) {
			var newMenuItem = MenuItems[index].cloneNode(true);
			newMenuItem.setAttribute("class", "identity_clone-popup-item person-icon")
			vI_msgIdentityClone.elements.Obj_MsgIdentityPopup_clone.appendChild(newMenuItem)
			if (vI_msgIdentityClone.elements.Obj_MsgIdentity.selectedItem == MenuItems[index])
				vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.selectedItem = newMenuItem;
			// "accountname" property changed in Thunderbird 3.x, Seamonkey 1.5x to "description"
			newMenuItem.setAttribute("accountname", vI.helper.getAccountname(newMenuItem))
		}
		vI_msgIdentityClone.elements.Obj_MsgIdentity_clone
			.setAttribute("value", vI_msgIdentityClone.elements.Obj_MsgIdentity.selectedItem.getAttribute("value"));
		vI_msgIdentityClone.elements.Obj_MsgIdentity_clone
			.setAttribute("label", vI_msgIdentityClone.elements.Obj_MsgIdentity.selectedItem.getAttribute("label"));
		vI_msgIdentityClone.elements.Obj_MsgIdentity_clone
			.setAttribute("accountkey", vI_msgIdentityClone.elements.Obj_MsgIdentity.selectedItem.getAttribute("accountkey"));
		vI_msgIdentityClone.elements.Obj_MsgIdentity_clone
			.setAttribute("accountname", vI.helper.getAccountname(vI_msgIdentityClone.elements.Obj_MsgIdentity.selectedItem));
	},
	
	resetMenuToDefault : function () {
		vI_msgIdentityClone.setMenuToIdentity(gAccountManager.defaultAccount.defaultIdentity.key, false);
	},

	setMenuToIdentity : function (identitykey, startup) {
		MenuItems = vI_msgIdentityClone.elements.Obj_MsgIdentityPopup_clone.childNodes
		for (index = 0; index < MenuItems.length; index++) {
			if (MenuItems[index].getAttribute("value") ==
				identitykey) {
					vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.selectedItem =
						MenuItems[index];
					break;
			}
		}
		vI_msgIdentityClone.LoadIdentity(startup);
	},
	
	copySelectedIdentity : function() {
		// copy selected Menu-Value from clone to orig.
		MenuItems = vI_msgIdentityClone.elements.Obj_MsgIdentity.firstChild.childNodes
		for (index = 0; index < MenuItems.length; index++) {
			if ( MenuItems[index].getAttribute("value")
				== vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.getAttribute("value") ) {
				vI_msgIdentityClone.elements.Obj_MsgIdentity.selectedItem = MenuItems[index];
				vI_msgIdentityClone.elements.Obj_MsgIdentity.value = MenuItems[index].getAttribute("value");
				break;
			}
		}
	},
	
	initMsgIdentityTextbox_clone : function() {
		if (!vI_msgIdentityClone.elements.Obj_MsgIdentityTextbox_clone)
			vI_msgIdentityClone.elements.Obj_MsgIdentityTextbox_clone
				= document.getElementById("msgIdentity_clone_textbox");
	},
	
	// this LoadIdentity - oncommand is used by our clone MsgIdentity Menu
	// if VIdentity Extension is closed after the extension area was opened at least once,
	// remove the Virtual Account if a different (usual) Account is choosen in the cloned dropdown-menu
	LoadIdentity : function(startup)
	{
		if (vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.selectedItem.value != "vid") {
			vI_msgIdentityClone.copySelectedIdentity();
			vI_smtpSelector.resetMenuToMsgIdentity(
				vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.selectedItem.value);
			vI_notificationBar.dump("## vI_msgIdentityClone: calling LoadIdentity(" + startup +") from MsgCompose\n")
			LoadIdentity(startup);
		}
		vI_msgIdentityClone.initMsgIdentityTextbox_clone();
		vI_msgIdentityClone.elements.Obj_MsgIdentityTextbox_clone.value =
			vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.selectedItem.getAttribute("label");
		vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.setAttribute("accountname",
			vI.helper.getAccountname(vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.selectedItem));
		vI_msgIdentityClone.markAsNewAccount(vI_msgIdentityClone.isNewIdentity());
	},
	
	setIdentity : function(newName) {
		vI_msgIdentityClone.initMsgIdentityTextbox_clone();
		vI_msgIdentityClone.elements.Obj_MsgIdentityTextbox_clone.value = newName;
		vI_msgIdentityClone.markAsNewAccount(vI_msgIdentityClone.isNewIdentity());
	},
	
	blurEvent : function() {
		vI_msgIdentityClone.initMsgIdentityTextbox_clone();
		var address = vI.helper.getAddress();
		vI_msgIdentityClone.elements.Obj_MsgIdentityTextbox_clone.value = address.combinedName;
		vI_msgIdentityClone.elements.Obj_MsgIdentityTextbox_clone.setAttribute("value",address.combinedName)
	},
	
	inputEvent :  function()
	{
		vI_msgIdentityClone.initMsgIdentityTextbox_clone();
		// compare Identity with existant ones and prepare Virtual-Identity if nonexistant found
		vI_msgIdentityClone.markAsNewAccount(vI_msgIdentityClone.isNewIdentity());
	},
	
	markAsNewAccount : function(newIdentity) {
		vI_msgIdentityClone.initMsgIdentityTextbox_clone();
		if (newIdentity) {
			if (vI.replacement_functions.replaceGenericFunction()) {
				if (vI.elements.Obj_vILogo.getAttribute("hidden") != "false") {
					vI_msgIdentityClone.elements.Obj_MsgIdentityTextbox_clone
						.setAttribute("class", vI_msgIdentityClone.text_virtualId_class);
					vI_msgIdentityClone.elements.Obj_MsgIdentity_clone
						.setAttribute("class", vI_msgIdentityClone.icon_virtualId_class);
					if (vI_msgIdentityClone.elements.Obj_MsgIdentity_clone
						.getAttribute("value") != "vid") {
						vI_msgIdentityClone.elements.Obj_MsgIdentity_clone
							.setAttribute("value","vid")
						var accountname = document.getElementById("prettyName-Prefix")
									.getAttribute("label")
									+ vI_msgIdentityClone.elements.Obj_MsgIdentity_clone
									.getAttribute("accountname")
						vI_msgIdentityClone.elements.Obj_MsgIdentity_clone
							.setAttribute("accountname", accountname)
					}
					vI.elements.Obj_vILogo.setAttribute("hidden","false");
				}
			}
		}
		else {
			if (vI.elements.Obj_vILogo.getAttribute("hidden") != "true") {
				vI_msgIdentityClone.elements.Obj_MsgIdentityTextbox_clone
					.setAttribute("class", vI_msgIdentityClone.text_usualId_class);
				vI_msgIdentityClone.elements.Obj_MsgIdentity_clone
					.setAttribute("class", vI_msgIdentityClone.icon_usualId_class);
				vI.Cleanup();
				vI.elements.Obj_vILogo.setAttribute("hidden","true");
			}
		}
	},
	
	// checks if the Identity currently described by the extension-area fields i still available as
	// a stored identity. If so, use the stored one.
	isNewIdentity : function()
	{
		vI_msgIdentityClone.initMsgIdentityTextbox_clone();
		var address = vI.helper.getAddress();
		var accounts = queryISupportsArray(gAccountManager.accounts, Components.interfaces.nsIMsgAccount);
		for (var i in accounts) {
			var server = accounts[i].incomingServer;
				//  ignore (other) virtualIdentity Accounts
				if (!server || server.hostName == "virtualIdentity") continue;
			
				var identites = queryISupportsArray(accounts[i].identities, Components.interfaces.nsIMsgIdentity);
				for (var j in identites) {
					var identity = identites[j];
					var smtpKey = identity.smtpServerKey;
					if (!identity.smtpServerKey) smtpKey = accounts[i].defaultIdentity.smtpServerKey;
					if (!identity.smtpServerKey) smtpKey = vI_smtpSelector.smtpService.defaultServer.key;
					if (	identity.getUnicharAttribute("fullName") == address.name &&
						identity.getUnicharAttribute("useremail") == address.email &&
						smtpKey == vI_smtpSelector.elements.Obj_SMTPServerList.selectedItem.getAttribute('key')) {
					//~ if (	identity.getUnicharAttribute("fullName") == FullName &&
						//~ identity.getUnicharAttribute("useremail") == Useremail) {
							//~ // all values are identical to an existing Identity
							// set Identity combobox to this value
							vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.setAttribute("value", identity.key);
							vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.setAttribute("label", address.name + " <" + address.email + ">");
							vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.setAttribute("accountname", " - " + accounts[i].incomingServer.prettyName);
							vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.setAttribute("accountkey", "");
							return false;
						}
					}
			}
		return true;
	},
}
