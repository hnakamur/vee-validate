---
title: Form
description: API reference for the Form component
menuTitle: '<Form />'
order: 2
---

# Form

## Form Component

The `<Form />` component is like its name, a simple HTML form but with a few adjustments and DX improvements, By default it will render a native HTML `form` element.

```vue
<Form>
  <Field name="password" as="input" type="password" />
</Form>
```

## Rendering Forms

Just like the `Field` component you can pass whatever you want to render in its place, for example a custom `v-form` component that is registered globally:

```vue
<Form as="v-form">
  <Field name="password" as="input" type="password" />
</Form>
```

By default a `submit` and `reset` listeners are added to the rendered tag specified by the `as` prop.

For more complex form markup, you can render a `div` and inline your forms in the `Form` component's slots.

```vue
<Form as="div">
  <h2>Sign up form</h2>
  <form>
    <Field name="name" as="input"" />
    <Field name="email" as="input" type="email" />
    <Field name="password" as="input" type="password" />
  </form>
</Form>
```

<doc-tip type="danger" title="HTML Case Insensitivity">

Notice the character-case difference between `Form` and `form`, the uppercased one is the component provided by vee-validate while the lowercased one is the native `form` element, you might run into issues when not using Vue compiler workflow like script tags. In these cases it is recommended to rename the `Form` component to something that will not conflict with native HTML.

```js
// Using named imports
import { From as ValidationForm } from 'vee-validate';

const component = {
  components: {
    // If you have VeeValidate globally via a CDN script
    ValidationForm: VeeValidate.Form,
  },
};
```

</doc-tip>

Lastly, you can use the `Form` component slot props to access various aspects of the form state:

```vue
<Form v-slot="{ values }">
  <Field name="name" as="input" />
  <Field name="email" as="input" type="email" />
  <Field name="password" as="input" type="password" />

  <!-- prints current form values -->
  <pre>
    {{ values }}
  </pre>
</Form>
```

## Renderless Forms

While not recommended, you can make the `Form` component a renderless component by passing an empty string to the as prop, this is useful if you already need to add a form inside the scoped slot:

```vue
<Form as="" v-slot="{ values, submitForm }">
  <h2>Sign up form</h2>
  <form @submit="submitForm">
    <Field name="name" as="input" />
    <Field name="email" as="input" type="email" />
    <Field name="password" as="input" type="password" />

    <!-- prints current form values -->
    <pre>
      {{ values }}
    </pre>
  </form>
</Form>
```

## API Reference

### Props

| Prop             | Type                                 | Default     | Description                                                                                                  |
| :--------------- | :----------------------------------- | :---------- | :----------------------------------------------------------------------------------------------------------- |
| as               | `string`                             | `"form"`    | The element to render as a root node                                                                         |
| validationSchema | `Record<string, string \| Function>` | `undefined` | An object describing a schema to validate fields with, can be a plain object or a `yup` object schema        |
| initialValues    | `Record<string, any>`                | `undefined` | Initial values to fill the fields with, when provided the fields will be validated on mounted                |
| validateOnMount  | `boolean`                            | `false`     | If true, the fields currently present in the form will be validated when the `<Form />` component is mounted |

### Slots

#### default

The default slot gives you access to the following props:

<code-title level="4">

errors: Record<string, string>`

</code-title>

An object that maps field names to their error messages, it only takes the first error message of each field if multiple exists.

Here is an example of its shape:

```js
{
  email: "this field must be a valid email",
  password: "too short"
}
```

Any fields without error messages will not be included in the object. So you can safety iterate over it with `Object.keys()` knowing all the included fields are invalid.

<code-title level="4">

`isSubmitting: boolean`

</code-title>

Indicates if the submission handler is still running, once it resolves/rejects it will be automatically set to `false` again.

<code-title level="4">

`meta: FormMeta`

</code-title>

Contains an aggregated meta information/flags reflecting the state of all the fields inside the form.

```typescript
interface FormMeta {
  touched: boolean; // if at least one field is touched (was blurred)
  dirty: boolean; // if at least one field is dirty (manipulated)
  valid: boolean; // if all fields are valid
  pending: boolean; // if at least one field is pending validation
  initialValues?: Record<string, any>; // a map of the form's initial values
}
```

<code-title level="4">

`values: Record<string, any>`

</code-title>

Contains the current form values, it will only contain the active (non-disabled) fields.

<code-title level="4">

`setFieldError: (field: string, message: string) => void`

</code-title>

Sets a field's error message, useful for setting messages form an API or that are not available as a validation rule.

If you try to set an error for field doesn't exist, it will not affect the form's overall validity and will be ignored.

<code-title level="4">

`setErrors: (fields: Record<string, string>) => void`

</code-title>

Sets multiple fields error messages, uses `setFieldError` internally.

<code-title level="4">

`setFieldValue: (field: string, value: any) => void`

</code-title>

Sets a field's value, if a field does not exist it will not be reflected in the `values` ref. This will trigger validation on the field whose value changed.

<code-title level="4">

`setValues: (fields: Record<string, any>) => void`

</code-title>

Sets multiple fields values, will trigger validation for all the changed fields.

<code-title level="4">

`validate: () => Promise<boolean>`

</code-title>

Validates all the fields and populates the `errors` object, returns a promise that resolves to a boolean indicating if the validation was successful or not

<code-title level="4">

`handleSubmit: (evt: Event, cb: (values: Record<string, any>, ctx: SubmissionContext) => any) => Promise<void>`

</code-title>

This can be used as an event handler for `submit` events, it accepts the event object and a callback function that will run if the form is valid. If an event object is provided, `preventDefault` and `stopPropagation` will be automatically called on it.

Note that this is only useful if you are not rendering a form tag on the `<Form />` component. By default the `Form` component uses this handler to handle any `submit` events.

<code-title level="4">

`submitForm: (evt: Event) => void`

</code-title>

This function can also be used as an event handler for form `submit` event, the different that it will prevent the propagation and submission of the form as long as they are invalid. Once all the fields are valid it will submit the form with the native HTML behavior following the `form` element's `action` and `method` attributes.

This is useful if you plan to handle form submissions using a backend API like Laravel.

<code-title level="4">

`handleReset: () => void`

</code-title>

You can use this function as handler for the `reset` events on native form elements, it a