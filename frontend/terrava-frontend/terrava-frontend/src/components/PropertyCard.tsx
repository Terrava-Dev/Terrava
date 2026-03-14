import "./PropertyCard.css"
type Property = {
  id: number
  title: string
  locationName: string
  totalAreaInAcres: number
  pricePerAcre: number
  totalPrice: number
}

type Props = {
  property: Property
}

export default function PropertyCard({ property }: Props) {
  return (
    <div className="property-card">
      <img
        src="https://placehold.co/600x400"
        alt={property.title}
        className="property-image"
      />

      <div className="property-info">
        <h3>{property.title}</h3>
        <p className="location">{property.locationName}</p>

        <p>{property.totalAreaInAcres} Acres</p>
        <p>${property.pricePerAcre.toLocaleString()} / acre</p>

        <h4 className="price">
          ${property.totalPrice.toLocaleString()}
        </h4>
      </div>
    </div>
  )
}