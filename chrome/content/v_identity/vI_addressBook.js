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

    Contributor(s): Mike Krieger, Sebastian Apel
 * ***** END LICENSE BLOCK ***** */
 
/**
* some code copied and adapted from 'addressContext' and from 'Birthday Reminder'
* thanks to Mike Krieger and Sebastian Apel
*/

vI_addressBook = {
	CardFields : Array("Custom1", "Custom2", "Custom3", "Custom4", "Notes"),
	
	VIdentityString : null,
	
	elements : {
		Obj_aBookSave : null,
	},

	init: function() {
		vI_addressBook.elements.Obj_aBookSave = document.getElementById("aBook_save");
		vI_addressBook.elements.Obj_aBookSave.setAttribute("hidden",
					!vI.preferences.getBoolPref("aBook_use_non_vI"));
		vI_addressBook.elements.Obj_aBookSave.checked = vI.preferences.getBoolPref("aBook_storedefault");
	},

	removeVIdentityFromABook: function(remove) {
		// this function will be called exclusivly from vI_prefDialog. So it is used in different context than the rest of
		// the functions, access of vI.* is not possible
		// given the function paramter as false it might be used to count the fields which have a VirtualIdentity stored
		var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			.getService(Components.interfaces.nsIPromptService);
		var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"]
			.getService(Components.interfaces.nsIRDFService);
		
		counter = 0;
		
		// enumerate all of the address books on this system
		var parentDir = rdfService.GetResource("moz-abdirectory://").QueryInterface(Components.interfaces.nsIAbDirectory);
		var enumerator = parentDir.childNodes;
			
		//~ vI_notificationBar.dump("## vI_addressBook: Search Virtual Identities in addressbooks.\n")
		
		if (remove) {
			var number = vI_addressBook.removeVIdentityFromABook(false)
			var strings = document.getElementById("vIdentBundle");
			var warning = strings.getString("vident.clearAddressBook.status.prefix") + " " + number + " " +
					strings.getString("vident.clearAddressBook.status.postfix") + " " + 
					strings.getString("vident.clearAddressBook.warning")
			if (!promptService.confirm(window,"Warning",warning))
				return;
		}
		
		while (enumerator && enumerator.hasMoreElements()) {
			var addrbook = enumerator.getNext();  // an addressbook directory
			addrbook.QueryInterface(Components.interfaces.nsIAbDirectory);
			for each (var prop in vI_addressBook.CardFields) {
				var searchUri = addrbook.directoryProperties.URI + "?(or(" + prop + ",c,vIdentity:))"; // search for the address in this book
				var directory = rdfService.GetResource(searchUri).QueryInterface(Components.interfaces.nsIAbDirectory);
				// directory will now be a subset of the addressbook containing only those cards that match the searchstring 'address'
				var ChildCards = directory.childCards;
				var keepGoing = 1;
				try { ChildCards.first(); }
				catch (ex) { keepGoing = 0; }
				
				while (keepGoing == 1) {
					var Card = ChildCards.currentItem();
					Card = Card.QueryInterface(Components.interfaces.nsIAbCard);
					counter += 1;
					if (remove) {
						Card[prop.toLowerCase()] = "";
						Card.editCardToDatabase("");
					}
					
					try {
						ChildCards.next();
					} catch (ex) {
						keepGoing = 0;
					}
				}
			}
		}
		return counter;
	},

	getCardForAddress: function(email) {
		var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);
		
		// enumerate all of the address books on this system
		var parentDir = rdfService.GetResource("moz-abdirectory://").QueryInterface(Components.interfaces.nsIAbDirectory);
		var enumerator = parentDir.childNodes;
		
		var splitted = { number : 0, emails : {}, fullNames : {}, combinedNames : {} };
		vI.headerParser.parseHeadersWithArray(email, splitted.emails,
			splitted.fullNames, splitted.combinedNames);
		var recipient_email = splitted.emails.value[0]
		if (!recipient_email) return null;
	
		vI_notificationBar.dump("## vI_addressBook: Search '" + recipient_email + "' in addressbooks.\n")
		
		var matches = { number : 0, cards : {} }
		while (enumerator && enumerator.hasMoreElements()) {
			var addrbook = enumerator.getNext();  // an addressbook directory
			addrbook.QueryInterface(Components.interfaces.nsIAbDirectory);
			var searchUri = addrbook.directoryProperties.URI + "?(or(PrimaryEmail,c," + recipient_email + "))";  // search for the address in this book
			//~ vI_notificationBar.dump("## vI_addressBook: searchUri '" + searchUri + "'\n");
			var directory = rdfService.GetResource(searchUri).QueryInterface(Components.interfaces.nsIAbDirectory);
			// directory will now be a subset of the addressbook containing only those cards that match the searchstring 'address'
			var childCards = directory.childCards;
			
			var keepGoing = 1;
			try { childCards.first(); } catch (ex) { keepGoing = 0; }
			
			while (keepGoing == 1) {
				currentCard = childCards.currentItem();
				currentCard.QueryInterface(Components.interfaces.nsIAbCard);
				if (currentCard.primaryEmail.toLowerCase() == recipient_email.toLowerCase()) {
					vI_notificationBar.dump("## vI_addressBook: card found, primaryEmail '" + currentCard.primaryEmail.toLowerCase() + "'.\n")
					matches.cards[matches.number++] = currentCard;
				}
				try { childCards.next(); } catch (ex) {	keepGoing = 0; }
			}
		}
		
		// usual cases, found or not
		switch (matches.number) {
			case 0:
				vI_notificationBar.dump("## vI_addressBook: " + recipient_email + " not found.\n")
				return null;
			case 1:
				return matches.cards[0];
		}
		
		// upps, more than one matching address found
		vI_notificationBar.dump("## vI_addressBook WARNING: " + matches.number + " matching entries found.\n")
		for (index = 0; index < matches.number; index++) {
			for each (var prop in vI_addressBook.CardFields) {
				if (matches.cards[index][prop.toLowerCase()].indexOf("vIdentity: ") == 0) {
					vI_notificationBar.dump("## vI_addressBook WARNING: use first one with a stored Virtual Identity.\n")
					return matches.cards[index];
				}
			}
		}
		vI_notificationBar.dump("## vI_addressBook WARNING: none has a stored Virtual Identity, use first in set.\n")
		return matches.cards[0];
	},
				
	readVIdentityFromCard : function(Card) {
		vI_notificationBar.dump("## vI_addressBook: readVIdentityFromCard.\n")
		for each (var prop in vI_addressBook.CardFields) {
			prop = prop.toLowerCase();
			if (Card[prop].indexOf("vIdentity: ") == 0) {
				var newFullEmail=Card[prop].replace(/vIdentity: /,"");
				var infoIndex = newFullEmail.indexOf(" (id")
				if (!infoIndex) infoIndex = newFullEmail.indexOf(" (smtp")
				var info = null;
				if ( infoIndex != -1) {
					info = newFullEmail.substr(infoIndex+2).replace(/\)/,"").split(/,/)
					newFullEmail = newFullEmail.substr(0, infoIndex);
				}
				
				// split FullEmail into parts
				var splitted = { number : 0, emails : {}, fullNames : {}, combinedNames : {} };
				vI.headerParser.parseHeadersWithArray(newFullEmail, splitted.emails,
					splitted.fullNames, splitted.combinedNames);

				// format of addresses is choosen to be compatible with vI_smartIdentity
				var addresses = { number : 1,
						emails : Array(splitted.emails.value[0]),
						fullNames : Array(splitted.fullNames.value[0]),
						combinedNames : Array(splitted.combinedNames.value[0]),
						id_keys : {}, smtp_keys : {},
						fullABEntry : Array(Card[prop].replace(/vIdentity: /,"")) };
				if ( info && info[0] ) addresses.id_keys[0] = info[0];
				if ( info && info[1] ) addresses.smtp_keys[0] = info[1];
				vI_notificationBar.dump("## vI_addressBook: found '" + addresses.fullABEntry[0] + "'.\n")
				return addresses
			}
		}
		vI_notificationBar.dump("## vI_addressBook: no VIdentity information found.\n")
		return null;
	},
	
	equalsCurrentIdentity : function(addresses) {
		var old_address = vI.helper.getAddress();		
		var id_key = vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.getAttribute("oldvalue");
		if (!id_key) id_key = vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.getAttribute("value");
		var smtp_key = vI_smtpSelector.elements.Obj_SMTPServerList.selectedItem.getAttribute('key');
		//~ vI_notificationBar.dump("## vI_addressBook: '" + old_address.email + "'\n")
		//~ vI_notificationBar.dump("## vI_addressBook: '" + old_address.name + "'\n")
		//~ vI_notificationBar.dump("## vI_addressBook: '" + id_key + "'\n")
		//~ vI_notificationBar.dump("## vI_addressBook: '" + smtp_key + "'\n")
		//~ vI_notificationBar.dump("## vI_addressBook: '" + addresses.emails[0] + "'\n")
		//~ vI_notificationBar.dump("## vI_addressBook: '" + addresses.fullNames[0] + "'\n")
		//~ vI_notificationBar.dump("## vI_addressBook: '" + addresses.id_keys[0] + "'\n")
		//~ vI_notificationBar.dump("## vI_addressBook: '" + addresses.smtp_keys[0] + "'\n")
		var equal = (	(!addresses.id_keys[0] || id_key == addresses.id_keys[0]) &&
				(!addresses.smtp_keys[0] || smtp_key == addresses.smtp_keys[0]) &&
				(old_address.email == addresses.emails[0]) &&
				(old_address.name == addresses.fullNames[0])	)
		if (equal) vI_notificationBar.dump("## vI_addressBook: Identities are the same.\n")
		else vI_notificationBar.dump("## vI_addressBook: Identities differ.\n")
		return equal;
	},
	
	getCurrentVIdentityString : function() {
		var old_address = vI.helper.getAddress();		
		var id_key = vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.getAttribute("oldvalue");
		if (!id_key) id_key = vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.getAttribute("value");
		var smtp_key = vI_smtpSelector.elements.Obj_SMTPServerList.selectedItem.getAttribute('key');
		return old_address.combinedName + " (" + id_key + "," + smtp_key + ")"
	},
	
	updateVIdentityFromABook: function(email) {
		if (!vI.preferences.getBoolPref("aBook_use")) return;
		var Card = vI_addressBook.getCardForAddress(email); if (!Card) return;
		var addresses = vI_addressBook.readVIdentityFromCard(Card)
		
		if (addresses) {				
			vI_notificationBar.dump("## vI_addressBook: compare with current Identity\n");
			// only update fields if new Identity is different than old one.
			if (!vI_addressBook.equalsCurrentIdentity(addresses)) {
				
				var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
						.getService(Components.interfaces.nsIPromptService);
				var warning = vI.elements.strings.getString("vident.updateVirtualIdentity.warning1") +
							email +
							vI.elements.strings.getString("vident.updateVirtualIdentity.warning2") +
							addresses.fullABEntry[0] +
							vI.elements.strings.getString("vident.updateVirtualIdentity.warning3");
				if (	vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.getAttribute("value") != "vid" ||
					!vI.preferences.getBoolPref("aBook_warn_vI_replace") ||
					promptService.confirm(window,"Warning",warning)) {						
					if (addresses.id_keys[0]) vI_msgIdentityClone.setMenuToIdentity(addresses.id_keys[0])
					if (addresses.smtp_keys[0]) vI_smtpSelector.setMenuToKey(addresses.smtp_keys[0])
					if (vI_msgIdentityClone.setIdentity(addresses.combinedNames[0]))
						vI_notificationBar.setNote(vI.elements.strings.getString("vident.smartIdentity.vIaBookUsage") + ".",
							"aBook_notification");
				}
			}
		}
	},
	
	writeVIdentityToABook : function(Card) {
		for each (var prop in vI_addressBook.CardFields) {
			prop = prop.toLowerCase();
			vI_notificationBar.dump("## vI_addressBook: checking " + prop + ".\n")
			if (Card[prop] == "" || Card[prop].indexOf("vIdentity: ") == 0) {
				Card[prop] = "vIdentity: " + vI_addressBook.VIdentityString;
				Card.editCardToDatabase("");
				vI_notificationBar.dump("## vI_addressBook: added vIdentity to AddressBook '" + vI_addressBook.VIdentityString + "' to field '" + prop + "'.\n")
				return;
			}
		}
		vI_notificationBar.dump("## vI_addressBook: no free field in AddressBook.\n")
	},
	
	updateABookFromVIdentity : function(email) {
		var Card = vI_addressBook.getCardForAddress(email)
		if (!Card) return;
		
		var addresses = vI_addressBook.readVIdentityFromCard(Card);
		var old_address = vI.helper.getAddress();
		
		if (addresses) {
			if (!vI_addressBook.equalsCurrentIdentity(addresses)) {
				var warning = 	vI.elements.strings.getString("vident.updateAddressBook.warning1") +
						email +
						vI.elements.strings.getString("vident.updateAddressBook.warning2") +
						addresses.fullABEntry[0] +
						vI.elements.strings.getString("vident.updateAddressBook.warning3") +
						vI_addressBook.VIdentityString +
						vI.elements.strings.getString("vident.updateAddressBook.warning4");
				vI_notificationBar.dump("## vI_addressBook: " + warning + ".\n")
				var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
					.getService(Components.interfaces.nsIPromptService);
				if (!vI.preferences.getBoolPref("aBook_warn_update") ||
						promptService.confirm(window,"Warning",warning))
					vI_addressBook.writeVIdentityToABook(Card);
			}
		}
		else vI_addressBook.writeVIdentityToABook(Card);
	},
	
	storeVIdentityToAllRecipients : function(msgType) {
		if (msgType != nsIMsgCompDeliverMode.Now) return;
		if (!vI.preferences.getBoolPref("aBook_use")) return;
		if (vI_msgIdentityClone.elements.Obj_MsgIdentity_clone.getAttribute("value") != "vid" &&
			!vI.preferences.getBoolPref("aBook_use_non_vI")) return;
		if (vI_addressBook.elements.Obj_aBookSave.getAttribute("hidden") == "false" ) {
			vI_notificationBar.dump("## vI_addressBook: switch shown.\n")
			if (!vI_addressBook.elements.Obj_aBookSave.checked) {
				vI_notificationBar.dump("## vI_addressBook: save button not checked.\n")
				return;
			}
		}
		else {
			vI_notificationBar.dump("## vI_addressBook: switch hidden.\n")
			if (!vI.preferences.getBoolPref("aBook_storedefault")) {
				vI_notificationBar.dump("## vI_addressBook: not be safed by default.\n")
				return;
			}
		}
		
		// store VIdentityString
		vI_addressBook.VIdentityString = vI_addressBook.getCurrentVIdentityString();
		
		for (var row = 1; row <= top.MAX_RECIPIENTS; row ++) {
			window.setTimeout(vI_addressBook.updateABookFromVIdentity, 50, awGetInputElement(row).value)
		}
	},
	
	getVIdentityFromAllRecipients : function(all_addresses) {
		// var all_addresses = { number : 0, emails : {}, fullNames : {},
		//			combinedNames : {}, id_keys : {}, smtp_keys : {} };
		for (var row = 1; row <= top.MAX_RECIPIENTS; row ++) {
			var Card = vI_addressBook.getCardForAddress(awGetInputElement(row).value);
			if (!Card) continue;
			var addresses = vI_addressBook.readVIdentityFromCard(Card);
			if (addresses) vI_smartIdentity.addWithoutDuplicates(all_addresses,
				addresses.emails[0],
				addresses.fullNames[0],
				addresses.combinedNames[0],
				addresses.id_keys[0],
				addresses.smtp_keys[0])
		}
		return all_addresses;
	}

}