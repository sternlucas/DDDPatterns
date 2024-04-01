import EventHandlerInterface from "../../../@shared/event/event-handler.interface";
import Customer from "../../entity/customer";
import CustomerChangeAddressEvent from "../customer-change-address.event";

export default class EnviaConsoleLogHandler
    implements EventHandlerInterface<CustomerChangeAddressEvent>
{
    handle(event: CustomerChangeAddressEvent): void {
        const customer = event.eventData.customer as Customer
        const address = customer.Address.toString()
        console.log(`Endereço do cliente: ${customer.id}, ${customer.name} alterado para: ${address}`);
    }
}
