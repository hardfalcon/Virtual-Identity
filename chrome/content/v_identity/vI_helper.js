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

    Contributor(s): 
 * ***** END LICENSE BLOCK ***** */

var vI_helper = {
	// simplified versionChecker, type is "TB" or "SM"
	// returns true if appVersion is smaller or equal version
	olderVersion : function (type, version) {
		var appID = null; var appVersion = null;
		const THUNDERBIRD_ID = "{3550f703-e582-4d05-9a08-453d09bdfdc6}";
		const SEAMONKEY_ID = "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}";

		var versionChecker;
		if("@mozilla.org/xre/app-info;1" in Components.classes) {
			var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
				.getService(Components.interfaces.nsIXULAppInfo);
			appID = appInfo.ID
			appVersion = appInfo.version
		}
		if ((type == "TB" && appID != THUNDERBIRD_ID) ||
			(type == "SM" && appID != SEAMONKEY_ID)) return null;

		if (!version) return ((type == "TB" && appID == THUNDERBIRD_ID) ||
			(type == "SM" && appID == SEAMONKEY_ID))

		if("@mozilla.org/xpcom/version-comparator;1" in Components.classes)
			versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
				.getService(Components.interfaces.nsIVersionComparator);
		else return null;
		
		return (versionChecker.compare(appVersion, version) < 0)
	},

	extensionActive : function (extensionID) {
		// seamonkey has no extension-manager, return false in this case
		if (("nsIExtensionManager" in Components.interfaces) && ("@mozilla.org/extensions/manager;1" in Components.classes)) {
			var em = Components.classes["@mozilla.org/extensions/manager;1"]
				.getService(Components.interfaces.nsIExtensionManager);
			var rdfS = Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);
			var source = rdfS.GetResource("urn:mozilla:item:"+extensionID);
			
			var item = em.getItemForID(extensionID);
			if (!item || !item.installLocationKey) return false;

			var disabledResource = rdfS.GetResource("http://www.mozilla.org/2004/em-rdf#disabled");
			var isDisabledResource = rdfS.GetResource("http://www.mozilla.org/2004/em-rdf#isDisabled");
			var disabled = em.datasource.GetTarget(source, disabledResource, true);
			if (!disabled) disabled = em.datasource.GetTarget(source, isDisabledResource, true);

			try {
				disabled=disabled.QueryInterface(Components.interfaces.nsIRDFLiteral);
				if (disabled.Value=="true") return false;
			} catch (e) { }
			return true;
		}
		else return false;
	}
}
