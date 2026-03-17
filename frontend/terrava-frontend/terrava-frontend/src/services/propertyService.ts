import axios from "axios"
import type { Property } from "../models/Property"

const API_URL = `${import.meta.env.VITE_API_URL}/properties`

export const getProperties = async (agentId: number): Promise<Property[]> => {
  const response = await axios.get(API_URL, {
    params: { agentId }
  })
  return response.data
}