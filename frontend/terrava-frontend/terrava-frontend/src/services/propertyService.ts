import axios from "axios"
import type { Property } from "../models/Property"

const API_URL = "https://localhost:7155/api/properties"

export const getProperties = async (agentId: number): Promise<Property[]> => {
  const response = await axios.get(API_URL, {
    params: { agentId }
  })
  return response.data
}