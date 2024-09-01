export interface ButterflyDetails {
	GUID: string;
	Name: string;
	Family: string;
	Location: string;
	Date: string;
	Wingspan: string;
	Weight: string;
	Price: string;
	Abundance: number;
	ColorRating: number;
	Habitat: string;
	Lifespan: string;
	MigrationPattern: string;
	ThreatLevel: string;
}

export interface ButterflyCollection {
	butterflies: ButterflyDetails[];
}

export interface ParsedButterflyDetails {
	GUID: string;
	Name: string;
	Family: string;
	Location: string;
	Date: string;
	Wingspan: number;
	Weight: number;
	Price: number;
	Abundance: number;
	ColorRating: number;
	Habitat: string;
	Lifespan: number;
	MigrationPattern: string;
	ThreatLevel: string;
}

export interface ParsedButterflyCollection {
	butterflies: ParsedButterflyDetails[];
}
