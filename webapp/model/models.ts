import BindingMode from "sap/ui/model/BindingMode";
import Device from "sap/ui/Device";
import JSONModel from "sap/ui/model/json/JSONModel";

export default {
	createDeviceModel: () => {
		const oModel = new JSONModel(Device);
		oModel.setDefaultBindingMode(BindingMode.OneWay);
		return oModel;
	},
};
