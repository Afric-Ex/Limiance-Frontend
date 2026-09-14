import classes from "@/src/styles/home.module.css";
import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
} from "@mantine/core";

const groceries = [
  {
    value: "What is Afriq?",
    description: (
      <span>
        <span className="text-primary">Afriq</span> is a distributed,
        cryptographically-secure database structure that allows network
        participants to establish a trusted and immutable record of
        transactional data without the need for intermediaries. A blockchain can
        execute a variety of functions beyond transaction settlement, such as
        smart contracts. Smart contracts are digital agreements that are
        embedded in code and that can have limitless formats and conditions
      </span>
    ),
  },
  {
    value: "How does Afriq works?",
    description:
      "Naturally sweet and potassium-rich fruit. Bananas are a popular choice for their energy-boosting properties and can be enjoyed as a quick snack, added to smoothies, or used in baking.",
  },
  {
    value: "What are the benefits of using Afriq",
    description:
      "Nutrient-packed green vegetable. Broccoli is packed with vitamins, minerals, and fiber. It has a distinct flavor and can be enjoyed steamed, roasted, or added to stir-fries.",
  },
  {
    value: "Is Afriq Free to use?",
    description:
      "Nutrient-packed green vegetable. Broccoli is packed with vitamins, minerals, and fiber. It has a distinct flavor and can be enjoyed steamed, roasted, or added to stir-fries.",
  },
  {
    value: "What are cryptocurrency wallets, and which one should I use?",
    description:
      "Nutrient-packed green vegetable. Broccoli is packed with vitamins, minerals, and fiber. It has a distinct flavor and can be enjoyed steamed, roasted, or added to stir-fries.",
  },
];

export function FAQ() {
  const items = groceries.map((item, idx) => (
    <AccordionItem key={item.value} value={item.value}>
      <AccordionControl
        icon={
          <span className="md:w-50px md:h-12 w-8 h-10 rounded-lg md:text-19px text-sm font-bold text-white flex items-center justify-center bg-primary">
            {idx + 1}
          </span>
        }
      >
        {item.value}
      </AccordionControl>
      <AccordionPanel>{item.description}</AccordionPanel>
    </AccordionItem>
  ));

  return (
    <Accordion classNames={classes} defaultValue="Apples">
      {items}
    </Accordion>
  );
}
