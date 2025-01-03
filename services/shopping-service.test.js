describe("ShoppingService", () => {
  describe("PlaceOrder", () => {
    test("should throw an error for missing customerId", async () => {
      const shoppingService = new ShoppingService();
      const invalidInput = { items: [{ productId: "123", amount: 2 }] };

      await expect(shoppingService.PlaceOrder(invalidInput))
        .rejects
        .toThrow("Customer ID is required");
    });

    test("should throw an error for empty items array", async () => {
      const shoppingService = new ShoppingService();
      const invalidInput = { customerId: "456", items: [] };

      await expect(shoppingService.PlaceOrder(invalidInput))
        .rejects
        .toThrow("Order items cannot be empty");
    });

    test("should calculate total amount correctly", async () => {
      const shoppingService = new ShoppingService();
      jest.spyOn(shoppingService, "GetProductDetails").mockResolvedValue([
        { _id: "123", price: 10 },
        { _id: "124", price: 15 }
      ]);

      const input = {
        customerId: "456",
        items: [
          { productId: "123", amount: 2 },
          { productId: "124", amount: 3 }
        ]
      };

      const result = await shoppingService.PlaceOrder(input);

      expect(result.totalAmount).toBe(65);
    });

    test("should save the order to the database", async () => {
      const shoppingService = new ShoppingService();
      jest.spyOn(shoppingService, "SaveOrder").mockResolvedValue({
        orderId: "789",
        customerId: "456",
        items: [
          { productId: "123", amount: 2 },
          { productId: "124", amount: 3 }
        ],
        totalAmount: 65,
        status: "received"
      });

      const input = {
        customerId: "456",
        items: [
          { productId: "123", amount: 2 },
          { productId: "124", amount: 3 }
        ]
      };

      const result = await shoppingService.PlaceOrder(input);

      expect(result).toMatchObject({
        orderId: "789",
        customerId: "456",
        totalAmount: 65,
        status: "received"
      });
    });

    test("should handle product stock reduction", async () => {
      const shoppingService = new ShoppingService();
      jest.spyOn(shoppingService, "ReduceProductStock").mockResolvedValue(true);
      jest.spyOn(shoppingService, "SaveOrder").mockResolvedValue({
        orderId: "789",
        customerId: "456",
        items: [
          { productId: "123", amount: 2 },
          { productId: "124", amount: 3 }
        ],
        totalAmount: 65,
        status: "received"
      });

      const input = {
        customerId: "456",
        items: [
          { productId: "123", amount: 2 },
          { productId: "124", amount: 3 }
        ]
      };

      await shoppingService.PlaceOrder(input);

      expect(shoppingService.ReduceProductStock).toHaveBeenCalledWith([
        { productId: "123", amount: 2 },
        { productId: "124", amount: 3 }
      ]);
    });

    test("should throw an error if product stock is insufficient", async () => {
      const shoppingService = new ShoppingService();
      jest.spyOn(shoppingService, "ReduceProductStock").mockImplementation(() => {
        throw new Error("Insufficient stock for product");
      });

      const input = {
        customerId: "456",
        items: [
          { productId: "123", amount: 10 }
        ]
      };

      await expect(shoppingService.PlaceOrder(input))
        .rejects
        .toThrow("Insufficient stock for product");
    });
  });
});