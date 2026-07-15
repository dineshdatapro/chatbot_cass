import { apiClient } from "@/api/client";
import type { WidgetConfig } from "@/components/ChatWidget";

export type WidgetConfigResponse = {
  bot_id: string;
  config: WidgetConfig;
};

export type WidgetSettingsResponse = {
  bot_id: string;
  updated_at: string;
  config: WidgetConfig;
};

export async function getWidgetConfig(botId = "default"): Promise<WidgetConfigResponse> {
  const { data } = await apiClient.get<WidgetConfigResponse>("/widget/config", {
    params: { bot_id: botId },
  });
  return data;
}

export async function saveWidgetSettings(
  config: WidgetConfig,
  botId = "default",
): Promise<WidgetSettingsResponse> {
  const { data } = await apiClient.post<WidgetSettingsResponse>("/widget/settings", {
    bot_id: botId,
    config,
  });
  return data;
}
