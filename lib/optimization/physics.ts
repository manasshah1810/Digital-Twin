export const PHYSICS = {
    dieselPrice: 1.12, // USD/L base
    truckMileage: 3.8, // km/L
    railEfficiency: 12.0, // km/L
    seaEfficiency: 45.0, // km/L
    maintenancePerKm: 0.15, // USD
    avgSpeed: { truck: 60, rail: 45, sea: 25 } // km/h
}

export const REGIONAL_MARKET: Record<string, number> = {
    'INDIA': 1.12,
    'SINGAPORE': 2.10,
    'UAE': 0.85,
    'USA': 0.95,
    'DEFAULT': 1.25
}

export function getRegionalFuelPrice(country?: string) {
    const c = country?.toUpperCase() || 'DEFAULT'
    return REGIONAL_MARKET[c] || REGIONAL_MARKET['DEFAULT']
}

export function calculatePhysicsCost(distance: number, mode: string, country?: string, tripWeight: number = 0, capacity: number = 20000) {
    const fuelPrice = getRegionalFuelPrice(country)
    let mileage = PHYSICS.truckMileage
    let fees = 50

    const lowMode = mode.toLowerCase()

    // Generalized heuristic categorization for 54+ modes
    const isSea = lowMode.includes('sea') || lowMode.includes('maritime') || lowMode.includes('vessel') || lowMode.includes('ocean')
    const isRail = lowMode.includes('rail') || lowMode.includes('train') || lowMode.includes('freight')
    const isAir = lowMode.includes('air') || lowMode.includes('flight') || lowMode.includes('plane') || lowMode.includes('aviation')

    if (isSea) {
        mileage = PHYSICS.seaEfficiency
        fees = 450
    } else if (isRail) {
        mileage = PHYSICS.railEfficiency
        fees = 150
    } else if (isAir) {
        mileage = 0.8 // km/L for cargo plane
        fees = 1200
    }

    // Dynamic Fuel Consumption: Heavier loads consume more fuel (up to 35% increase)
    const loadFactor = Math.min(tripWeight / (capacity || 1), 1.0)
    const massMultiplier = 1.0 + (loadFactor * 0.35)

    // Adjusted fuel usage
    const baselineFuelUsage = distance / (mileage || 1)
    const fuelUsage = baselineFuelUsage * massMultiplier
    const fuelCost = fuelUsage * fuelPrice
    const maintenance = distance * PHYSICS.maintenancePerKm

    return {
        total: fuelCost + maintenance + fees,
        breakdown: {
            fuel: fuelCost,
            maintenance: maintenance,
            fees: fees,
            distanceKm: distance,
            fuelPriceUsed: fuelPrice,
            efficiencyUsed: mileage,
            loadFactorApplied: loadFactor
        }
    }
}
