import axios from "axios"
import type { Property } from "../models/Property"

const API_URL = "https://localhost:7155/api/properties"

export const getProperties = async (): Promise<Property[]> => {
  const response = await axios.get(API_URL)
  return response.data
}