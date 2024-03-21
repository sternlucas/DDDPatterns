import { Sequelize } from "sequelize-typescript";
import { faker } from '@faker-js/faker';
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  async function createOrder(orderItem: OrderItem): Promise<Order> {
    const customerRepository = new CustomerRepository();
    const customer = new Customer(faker.string.uuid(), "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const order = new Order(faker.string.uuid(), customer.id, [orderItem]);

    return order;
  }

  function createOrderItem(product: Product): OrderItem {
    const orderItem = new OrderItem(
      faker.string.uuid(),
      product.name,
      product.price,
      product.id,
      faker.number.int({ min: 1, max: 10 })
    );

    return orderItem
  }

  async function createProduct(): Promise<Product> {
    const productRepository = new ProductRepository();
    const product = new Product(faker.string.uuid(), faker.commerce.productName(), faker.number.float({ fractionDigits: 2 }));
    await productRepository.create(product);

    return product
  }

  it("should create a new order", async () => {
    const product = await createProduct();
    const orderItem = createOrderItem(product);
    const order = await createOrder(orderItem);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: order.id,
      customer_id: order.customerId,
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: order.id,
          product_id: product.id,
        },
      ],
    });
  });

  it("should update a order", async () => {
    const product = await createProduct();
    const orderItem = createOrderItem(product);
    const order = await createOrder(orderItem);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const product2 = await createProduct();
    const orderItem2 = createOrderItem(product2)
    order.addItem(orderItem2)
    await orderRepository.update(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: order.id,
      customer_id: order.customerId,
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: order.id,
          product_id: product.id,
        },
        {
          id: orderItem2.id,
          name: orderItem2.name,
          price: orderItem2.price,
          quantity: orderItem2.quantity,
          order_id: order.id,
          product_id: product2.id,
        }
      ],
    });
  });

  it("should find a order", async () => {
    const product = await createProduct();
    const orderItem = createOrderItem(product);
    const order = await createOrder(orderItem);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderResult = await orderRepository.find(order.id);

    expect(order).toStrictEqual(orderResult);
  });

  it("should find all orders", async () => {
    const product = await createProduct();
    const orderItem = createOrderItem(product);
    const order = await createOrder(orderItem);

    const product2 = await createProduct();
    const orderItem2 = createOrderItem(product2);
    const order2 = await createOrder(orderItem2);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);
    await orderRepository.create(order2);

    const orders = await orderRepository.findAll();

    expect(orders).toHaveLength(2);
    expect(orders).toContainEqual(order);
    expect(orders).toContainEqual(order2);
  });
});
