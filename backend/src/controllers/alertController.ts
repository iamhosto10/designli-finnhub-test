import { Request, Response } from "express";
import Alert from "../models/Alert.js";

export const createAlert = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId, symbol, targetPrice } = req.body;

    const newAlert = new Alert({
      userId,
      symbol,
      targetPrice,
    });

    await newAlert.save();
    res
      .status(201)
      .json({ message: "Alert created successfully", alert: newAlert });
  } catch (error) {
    res.status(500).json({ message: "Error creating alert", error });
  }
};

export const getUserAlerts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;

    const alerts = await Alert.find({ userId, isActive: true }).sort({
      createdAt: -1,
    });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Error getting alerts", error });
  }
};
