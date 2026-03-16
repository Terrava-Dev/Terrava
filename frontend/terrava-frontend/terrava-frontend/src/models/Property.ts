export type Property = {
  id: number
  title: string
  locationName: string
  totalAreaInSqFt: number
  pricePerAcre: number
  pricePerSqFt: number
  totalPrice: number
  amenities?: string
  propertyType?: string
  status?: string
  notes?: string
  agentId?: number
  images?: { id: number; imageUrl: string; propertyId: number }[]
  boundaryPoints?: { id: number; latitude: number; longitude: number; propertyId: number }[]
}