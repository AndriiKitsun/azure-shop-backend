import { ServiceBusClient, ServiceBusMessage, ServiceBusSender } from "@azure/service-bus";

const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
const queueName = process.env.IMPORT_PRODUCT_QUEUE_NAME;

let serviceBusClient: ServiceBusClient;
let sender: ServiceBusSender;

export function initServiceBus() {
    serviceBusClient = new ServiceBusClient(connectionString);
    sender = serviceBusClient.createSender(queueName);
}

export async function closeServiceBus(): Promise<void> {
    await sender.close();
    await serviceBusClient.close();

    sender = null;
    serviceBusClient = null;

    console.log(`sender -->`, sender);
    console.log(`serviceBusClient -->`, serviceBusClient);
    
}

export async function sendMessage(payload: Record<string, any>): Promise<void> {
    const message: ServiceBusMessage = {
        body: payload
    };

    console.log(`message -->`, message);

    return sender.sendMessages(message);
}
