import {
	ButterflyDetails,
	ParsedButterflyCollection,
	ParsedButterflyDetails,
} from "./types";

export const BUTTERFLY_DATA_PATH = "../model/data.json";
export const PROPERTY_PATH = "/butterflies";

export function parseButterfly(data: ButterflyDetails): ParsedButterflyDetails {
	return {
		...data,
		Wingspan: parseFloat(data.Wingspan),
		Weight: parseFloat(data.Weight),
		Price: parseFloat(data.Price),
		Lifespan: parseFloat(data.Lifespan),
	};
}

export function parseButterflyCollection(
	data: ButterflyDetails[]
): ParsedButterflyCollection {
	return {
		butterflies: data.map(parseButterfly),
	};
}
