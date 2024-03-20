import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update(
      {
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        where: {
          id: entity.id,
        },
      }
    );
  }

  async find(id: string): Promise<Order> {
    const orderModel = await OrderModel.findOne(({
      where: { id: id },
      include: ["items"],
    }));

    const orderItems = orderModel.items.map<OrderItem>(orderItemModel => {
      const orderItem = new OrderItem(
        orderItemModel.id,
        orderItemModel.name,
        orderItemModel.price,
        orderItemModel.product_id,
        orderItemModel.quantity
      )

      return orderItem
    })

    const order = new Order(id, orderModel.customer_id, orderItems)

    return order;
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({ include: ["items"] });

    const orders = orderModels.map<Order>(orderModel => {
      const orderItems = orderModel.items.map<OrderItem>(orderItemModel => {
        const orderItem = new OrderItem(
          orderItemModel.id,
          orderItemModel.name,
          orderItemModel.price,
          orderItemModel.product_id,
          orderItemModel.quantity
        )

        return orderItem
      })

      const order = new Order(orderModel.id, orderModel.customer_id, orderItems)

      return order;
    });

    return orders
  }
}
