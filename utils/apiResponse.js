import { NextResponse } from "next/server";

export const createApiResponse = (message, data = null, status = 200) => {
  return {
    response: NextResponse.json(
      {
        message,
        data,
      },
      { status }
    ),
  };
};
