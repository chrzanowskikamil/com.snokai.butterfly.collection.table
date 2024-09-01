import BaseController from "./BaseController";

import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import Event from "sap/ui/base/Event";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Input from "sap/m/Input";
import JSONModel from "sap/ui/model/json/JSONModel";
import ListBinding from "sap/ui/model/ListBinding";
import ListItem from "sap/ui/core/ListItem";
import MessageBox from "sap/m/MessageBox";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import Select from "sap/m/Select";
import Table from "sap/ui/table/Table";
import Text from "sap/m/Text";

import {
	ButterflyCollection,
	ParsedButterflyCollection,
	ParsedButterflyDetails,
} from "../model/types";

import {
	BUTTERFLY_DATA_PATH,
	parseButterflyCollection,
	PROPERTY_PATH,
} from "../model/utils";

/**
 * @namespace com.snokai.butterfly.collection.table.controller
 */

export default class Main extends BaseController {
	private oEditDialog: Dialog;
	private oFreezeDialog: Dialog;
	private oSumDialog: Dialog;
	private searchFilters: Filter[];
	private i18n: ResourceBundle;

	public onInit(): void {
		this.i18n = this.getResourceBundle() as ResourceBundle;
		this._createEditDialog();
		this._createSumDialog();
		this._createFreezeDialog();
		void this._setDataModel();
	}

	public onAfterRendering(): void {
		void this._setAppTitle();
	}

	private async _fetchData(): Promise<ParsedButterflyCollection> {
		try {
			const response = await fetch(BUTTERFLY_DATA_PATH);
			const data = (await response.json()) as ButterflyCollection;
			return parseButterflyCollection(data.butterflies);
		} catch (error) {
			console.error("Failed to load data:", error);
			throw error;
		}
	}

	private async _setDataModel(): Promise<void> {
		try {
			const data = await this._fetchData();
			const oButterfliesModel = new JSONModel(data);
			this.setModel(oButterfliesModel, "butterflies");
		} catch (error) {
			console.error("Failed to load butterfly data:", error);
		}
	}

	private _getButterfliesModel(): ParsedButterflyDetails[] {
		const oModel = this.getModel("butterflies") as JSONModel;
		return oModel.getProperty(PROPERTY_PATH) as ParsedButterflyDetails[];
	}

	private _setButterfliesModel(aData: ParsedButterflyDetails[]): void {
		const oModel = this.getModel("butterflies") as JSONModel;
		oModel.setProperty(PROPERTY_PATH, aData);
		oModel.updateBindings(true);
	}

	private _setAppTitle(): void {
		try {
			const appTitle: string = this.i18n.getText("appTitle");
			document.title = appTitle;
		} catch (error) {
			console.error("Error setting document title: ", error);
		}
	}

	public onSearch(event: Event): void {
		// @ts-expect-error: The 'getParameter' method returns 'any', but we expect a 'string' here.
		// This is a known issue with the type definitions in the library. We are confident that
		// the 'query' parameter will be a string, so we safely cast it to 'string'.
		const searchQuery = event.getParameter("query") as string;
		this.searchFilters = [];

		if (searchQuery && searchQuery.length > 0) {
			const aFilters: Filter[] = [
				new Filter("GUID", FilterOperator.Contains, searchQuery),
				new Filter("Name", FilterOperator.Contains, searchQuery),
				new Filter("Family", FilterOperator.Contains, searchQuery),
				new Filter("Location", FilterOperator.Contains, searchQuery),
				new Filter("Date", FilterOperator.Contains, searchQuery),
				new Filter("Habitat", FilterOperator.Contains, searchQuery),
				new Filter("Migration Pattern", FilterOperator.Contains, searchQuery),
				new Filter("Threat Level", FilterOperator.Contains, searchQuery),
				new Filter("Wingspan", FilterOperator.EQ, searchQuery),
				new Filter("Weight", FilterOperator.EQ, parseFloat(searchQuery)),
				new Filter("Price", FilterOperator.EQ, parseFloat(searchQuery)),
				new Filter("Abundance", FilterOperator.EQ, parseInt(searchQuery, 10)),
				new Filter("Color Rating", FilterOperator.EQ, parseFloat(searchQuery)),
				new Filter("Lifespan", FilterOperator.EQ, parseFloat(searchQuery)),
			];

			const oFilter = new Filter({
				filters: aFilters,
				and: false,
			});

			this.searchFilters.push(oFilter);
		}

		this._applySearchFilters();
	}

	private _applySearchFilters(): void {
		const oTable = this.byId("table") as Table;
		const oBiding = oTable.getBinding("rows") as ListBinding;

		oBiding.filter(this.searchFilters);
	}

	public onAddNewRow(): void {
		MessageBox.confirm(this.i18n.getText("addEmptyRowConfirmation"), {
			onClose: (onAction: "OK") => {
				if (onAction === "OK") {
					const aData = this._getButterfliesModel();
					aData.push(this._createEmptyRow());
					this._setButterfliesModel(aData);

					// Scroll to the newly added row:
					const oTable = this.byId("table") as Table;
					oTable.setFirstVisibleRow(aData.length - 1);

					MessageBox.information(this.i18n.getText("addEmptyRowSuccess"));
				}
			},
		});
	}

	private _createEmptyRow(): ParsedButterflyDetails {
		return {
			GUID: "",
			Name: "",
			Family: "",
			Location: "",
			Date: "",
			Wingspan: null,
			Weight: null,
			Price: null,
			Abundance: null,
			ColorRating: null,
			Habitat: "",
			Lifespan: null,
			MigrationPattern: "",
			ThreatLevel: "",
		};
	}

	public onDuplicateRow(): void {
		const oTable = this.byId("table") as Table;
		const aSelectedIndices = oTable.getSelectedIndices();

		if (aSelectedIndices.length !== 1) {
			MessageBox.warning(this.i18n.getText("duplicateRowWrongSelection"));
			return;
		}

		MessageBox.confirm(this.i18n.getText("duplicateRowConfirmation"), {
			onClose: (oAction: "OK") => {
				if (oAction === "OK") {
					const aData = this._getButterfliesModel();

					const iSelectedIndex = aSelectedIndices[0];
					const oContext = oTable.getContextByIndex(iSelectedIndex);
					const oSelectedRowData = {
						...oContext.getObject(),
					} as ParsedButterflyDetails;

					aData.splice(iSelectedIndex + 1, 0, oSelectedRowData);

					this._setButterfliesModel(aData);

					MessageBox.success(this.i18n.getText("duplicateRowSuccess"));
				}
			},
		});
	}

	public onDeleteSelected(): void {
		const oTable = this.byId("table") as Table;
		const aSelectedIndices = oTable.getSelectedIndices();

		if (aSelectedIndices.length === 0) {
			MessageBox.warning(this.i18n.getText("deleteRowWrongSelection"));
			return;
		}

		MessageBox.confirm(this.i18n.getText("deleteRowConfirmation"), {
			onClose: (oAction: "OK") => {
				if (oAction === "OK") {
					const aData = this._getButterfliesModel();

					aSelectedIndices
						.sort((a, b) => b - a)
						.forEach((iIndex) => {
							const oContext = oTable.getContextByIndex(iIndex);
							const sPath = oContext.getPath();
							const iDataIndex = parseInt(sPath.split("/").pop(), 10);
							aData.splice(iDataIndex, 1);
						});

					this._setButterfliesModel(aData);
					oTable.clearSelection();

					MessageBox.success(this.i18n.getText("deleteRowSuccess"));
				}
			},
		});
	}

	private _createEditDialog(): void {
		const oSelect = new Select({
			width: "100%",
			items: [
				new ListItem({
					key: "GUID",
					text: this.i18n.getText("guidColumnName"),
				}),
				new ListItem({
					key: "Name",
					text: this.i18n.getText("nameColumnName"),
				}),
				new ListItem({
					key: "Family",
					text: this.i18n.getText("familyColumnName"),
				}),
				new ListItem({
					key: "Location",
					text: this.i18n.getText("locationColumnName"),
				}),
				new ListItem({
					key: "Date",
					text: this.i18n.getText("dateColumnName"),
				}),
				new ListItem({
					key: "Wingspan",
					text: this.i18n.getText("wingspanColumnName"),
				}),
				new ListItem({
					key: "Weight",
					text: this.i18n.getText("weightColumnName"),
				}),
				new ListItem({
					key: "Price",
					text: this.i18n.getText("priceColumnName"),
				}),
				new ListItem({
					key: "Abundance",
					text: this.i18n.getText("abundanceColumnName"),
				}),
				new ListItem({
					key: "Color Rating",
					text: this.i18n.getText("colorRatingColumnName"),
				}),
				new ListItem({
					key: "Habitat",
					text: this.i18n.getText("habitatColumnName"),
				}),
				new ListItem({
					key: "Lifespan",
					text: this.i18n.getText("lifespanColumnName"),
				}),
				new ListItem({
					key: "Migration Pattern",
					text: this.i18n.getText("migrationPatternColumnName"),
				}),
				new ListItem({
					key: "Threat Level",
					text: this.i18n.getText("threatLevelColumnName"),
				}),
			],
		});

		this.oEditDialog = new Dialog({
			title: this.i18n.getText("editColumnTitle"),
			content: [oSelect],
			beginButton: new Button({
				text: this.i18n.getText("editColumnButtonAccept"),
				press: () => this._applyColumnEdit(oSelect),
			}),
			endButton: new Button({
				text: this.i18n.getText("editColumnButtonCancel"),
				press: () => this.oEditDialog.close(),
			}),
		});

		this.getView().addDependent(this.oEditDialog);
	}

	public onEditColumn(): void {
		this.oEditDialog.open();
	}

	private _applyColumnEdit(oSelect: Select): void {
		const sSelectedColumn =
			oSelect.getSelectedKey() as keyof ParsedButterflyDetails;
		const oTable = this.byId("table") as Table;
		const aData = this._getButterfliesModel();

		aData.forEach((oItem) => {
			this._applyEditToItem(oItem, sSelectedColumn);
		});

		this._setButterfliesModel(aData);
		oTable.getBinding("rows")?.refresh();

		MessageBox.success(this.i18n.getText("editColumnSuccess"));
		this.oEditDialog.close();
	}

	private _applyEditToItem(
		item: ParsedButterflyDetails,
		column: keyof ParsedButterflyDetails
	): void {
		if (this._isNumericColumn(column)) {
			item[column] = item[column] * 3.3;
		} else if (this._isStringColumn(column)) {
			item[column] = item[column] + " ed.";
		}
	}

	private _isNumericColumn(
		column: keyof ParsedButterflyDetails
	): column is
		| "Wingspan"
		| "Weight"
		| "Price"
		| "Lifespan"
		| "Abundance"
		| "Color Rating" {
		return [
			"Wingspan",
			"Weight",
			"Price",
			"Lifespan",
			"Abundance",
			"Color Rating",
		].includes(column);
	}

	private _isStringColumn(
		column: keyof ParsedButterflyDetails
	): column is
		| "GUID"
		| "Name"
		| "Family"
		| "Location"
		| "Date"
		| "Habitat"
		| "Migration Pattern"
		| "Threat Level" {
		return [
			"GUID",
			"Name",
			"Family",
			"Location",
			"Date",
			"Habitat",
			"Migration Pattern",
			"Threat Level",
		].includes(column);
	}

	private _createSumDialog(): void {
		const oSelect = new Select({
			width: "100%",
			items: [
				new ListItem({
					key: "GUID",
					text: this.i18n.getText("guidColumnName"),
				}),
				new ListItem({
					key: "Name",
					text: this.i18n.getText("nameColumnName"),
				}),
				new ListItem({
					key: "Family",
					text: this.i18n.getText("familyColumnName"),
				}),
				new ListItem({
					key: "Location",
					text: this.i18n.getText("locationColumnName"),
				}),
				new ListItem({
					key: "Date",
					text: this.i18n.getText("dateColumnName"),
				}),
				new ListItem({
					key: "Wingspan",
					text: this.i18n.getText("wingspanColumnName"),
				}),
				new ListItem({
					key: "Weight",
					text: this.i18n.getText("weightColumnName"),
				}),
				new ListItem({
					key: "Price",
					text: this.i18n.getText("priceColumnName"),
				}),
				new ListItem({
					key: "Abundance",
					text: this.i18n.getText("abundanceColumnName"),
				}),
				new ListItem({
					key: "Color Rating",
					text: this.i18n.getText("colorRatingColumnName"),
				}),
				new ListItem({
					key: "Habitat",
					text: this.i18n.getText("habitatColumnName"),
				}),
				new ListItem({
					key: "Lifespan",
					text: this.i18n.getText("lifespanColumnName"),
				}),
				new ListItem({
					key: "Migration Pattern",
					text: this.i18n.getText("migrationPatternColumnName"),
				}),
				new ListItem({
					key: "Threat Level",
					text: this.i18n.getText("threatLevelColumnName"),
				}),
			],
		});

		const oSumText = new Text({
			text: this.i18n.getText("dialogAcceptButton"),
			width: "100%",
			visible: false,
		});

		this.oSumDialog = new Dialog({
			title: this.i18n.getText("sumDialogTitle"),
			content: [oSelect, oSumText],
			beginButton: new Button({
				text: this.i18n.getText("dialogAcceptButton"),
				press: () => this._calculateSum(oSelect),
			}),
			endButton: new Button({
				text: this.i18n.getText("dialogCloseButton"),
				press: () => this.oSumDialog.close(),
			}),
		});

		this.getView().addDependent(this.oSumDialog);
	}

	public onShowSum(): void {
		this.oSumDialog.open();
	}

	private _calculateSum(oSelect: Select): void {
		const sSelectedColumn = oSelect.getSelectedKey();
		const oDialog = oSelect.getParent() as Dialog;
		const oSumText = oDialog.getContent()[1] as Text;

		const aData = this._getButterfliesModel();

		let sum: number | string = 0;

		for (const item of aData) {
			if (typeof item[sSelectedColumn] === "number") {
				sum += item[sSelectedColumn];
			} else {
				sum = "-----------------";
				break;
			}
		}

		oSumText.setText(`${this.i18n.getText("sumResultMessage")} ${sum}`);
		oSumText.setVisible(true);
	}

	private _createFreezeDialog(): void {
		const oInputColumn = new Input({
			placeholder: this.i18n.getText("freezeFixedColumnMessage"),
			width: "100%",
		});
		const oInputRow = new Input({
			placeholder: this.i18n.getText("freezeFixedTopRowMessage"),
			width: "100%",
		});
		const oInputBottomRow = new Input({
			placeholder: this.i18n.getText("freezeFixedBottomRowMessage"),
			width: "100%",
		});

		this.oFreezeDialog = new Dialog({
			title: this.i18n.getText("freezeDialogTitle"),
			content: [oInputColumn, oInputRow, oInputBottomRow],
			beginButton: new Button({
				text: this.i18n.getText("dialogAcceptButton"),
				press: () =>
					this._applyFreezeSettings(oInputColumn, oInputRow, oInputBottomRow),
			}),
			endButton: new Button({
				text: this.i18n.getText("dialogCloseButton"),
				press: () => this.oFreezeDialog.close(),
			}),
		});

		this.getView().addDependent(this.oFreezeDialog);
	}

	private _applyFreezeSettings(
		oInputColumn: Input,
		oInputRow: Input,
		oInputBottomRow: Input
	): void {
		const iColumnCount = parseInt(oInputColumn.getValue(), 10) || 0;
		const iTopRowCount = parseInt(oInputRow.getValue(), 10) || 0;
		const iBottomRowCount = parseInt(oInputBottomRow.getValue(), 10) || 0;

		const oTable = this.byId("table") as Table;

		oTable.setFixedColumnCount(iColumnCount);

		oTable.getRowMode().setFixedTopRowCount(iTopRowCount);
		oTable.getRowMode().setFixedBottomRowCount(iBottomRowCount);

		this.oFreezeDialog.close();

		MessageBox.success(this.i18n.getText("freezeSuccess"));
	}

	public onShowFreezeDialog(): void {
		this.oFreezeDialog.open();
	}
}
