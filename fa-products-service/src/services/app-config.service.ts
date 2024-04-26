import { AppConfigurationClient } from "@azure/app-configuration";

const connectionString = process.env.AZURE_APP_CONFIG_CONNECTION_STRING!;
const client = new AppConfigurationClient(connectionString);

export async function getAppSetting(key: string): Promise<string | undefined> {
    try {
        const setting = await client.getConfigurationSetting({ key });

        return setting.value;
    } catch (err) {
        return undefined;
    }
}
