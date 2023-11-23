import { useForm, useField, useFieldArray, FieldEntry, FormContext, FieldArrayContext } from '@/vee-validate';
import { defineComponent, nextTick, onMounted, watch, Ref } from 'vue';
import * as yup from 'yup';
import { mountWithHoc, flushPromises } from './helpers';

test('can update a field entry model directly', async () => {
  mountWithHoc({
    setup() {
      useForm({
        initialValues: {
          users: ['1'],
        },
      });

      const { fields } = useFieldArray('users');
      onMounted(() => {
        const item = fields.value[0];
        item.value = 'test';
      });

      return {
        fields,
      };
    },
    template: `
      <p>{{ fields[0].value }}</p>
    `,
  });

  await flushPromises();
  expect(document.querySelector('p')?.innerHTML).toBe('test');
});

test('can update a field entry deep model directly and validate it', async () => {
  let fields!: Ref<FieldEntry<{ name: string }>[]>;
  mountWithHoc({
    setup() {
      const { errors } = useForm({
        validateOnMount: true,
        validationSchema: yup.object({
          users: yup.array().of(
            yup.object({
              name: yup.string().required(),
            }),
          ),
        }),
        initialValues: {
          users: [{ name: '' }],
        },
      });

      fields = useFieldArray<{ name: string }>('users').fields;

      return {
        fields,
        errors,
      };
    },
    template: `
      <p>{{ fields[0].value.name }}</p>
      <span>{{ errors }}</span>
    `,
  });

  await flushPromises();
  expect(document.querySelector('p')?.innerHTML).toBe('');
  expect(document.querySelector('span')?.innerHTML).toBeTruthy();

  const item = fields.value[0];
  item.value.name = 'test';

  await flushPromises();
  expect(document.querySelector('p')?.innerHTML).toBe('test');
  expect(document.querySelector('span')?.innerHTML).toBe('{}');
});

test('warns when updating a no-longer existing item', async () => {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => {
    // NOOP
  });
  mountWithHoc({
    setup() {
      useForm({
        initialValues: {
          users: ['1'],
        },
      });

      const { remove, fields } = useFieldArray('users');
      onMounted(() => {
        const item = fields.value[0];
        remove(0);

        nextTick(() => {
          item.value = 'test';
        });
      });
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();

  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});

test('warns when no form context is present', async () => {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => {
    // NOOP
  });
  mountWithHoc({
    setup() {
      const { push } = useFieldArray('users');
      push('');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();

  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});

test('duplicate calls yields the same instance', async () => {
  let removeFn!: (idx: number) => void;
  mountWithHoc({
    setup() {
      useForm({
        initialValues: {
          users: ['one'],
        },
      });

      const { fields, push } = useFieldArray('users');
      const { fields: fields2, remove } = useFieldArray('users');

      removeFn = remove;

      onMounted(() => {
        push('two');
      });

      return {
        fields,
        fields2,
      };
    },
    template: `
      <p id="arr1">{{ fields.map(f => f.value).join(', ') }}</p>
      <p id="arr2">{{ fields2.map(f => f.value).join(', ') }}</p>
    `,
  });

  await flushPromises();
  expect(document.querySelector('#arr1')?.innerHTML).toBe('one, two');
  expect(document.querySelector('#arr2')?.innerHTML).toBe('one, two');
  removeFn(0);
  await flushPromises();
  expect(document.querySelector('#arr1')?.innerHTML).toBe('two');
  expect(document.querySelector('#arr2')?.innerHTML).toBe('two');
});

// #4096
test('array push should trigger a silent validation', async () => {
  let form!: FormContext;
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      form = useForm<any>({
        initialValues: {
          users: ['one'],
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(form.meta.value.valid).toBe(true);
  arr.push('');
  await flushPromises();
  expect(form.meta.value.valid).toBe(false);
});

test('array push noop when path is not an array', async () => {
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      useForm<any>({
        initialValues: {
          users: 'test',
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
  arr.push('');
  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
});

// #4096
test('array prepend should trigger a silent validation', async () => {
  let form!: FormContext;
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      form = useForm<any>({
        initialValues: {
          users: ['one'],
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(form.meta.value.valid).toBe(true);
  arr.prepend('');
  await flushPromises();
  expect(form.meta.value.valid).toBe(false);
});

test('array prepend noop when path is not an array', async () => {
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      useForm<any>({
        initialValues: {
          users: 'test',
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
  arr.prepend('');
  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
});

// #4096
test('array insert should trigger a silent validation', async () => {
  let form!: FormContext;
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      form = useForm<any>({
        initialValues: {
          users: ['one', 'two'],
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(form.meta.value.valid).toBe(true);
  arr.insert(1, '');
  await flushPromises();
  expect(form.meta.value.valid).toBe(false);
});

test('array insert noop when path is not an array', async () => {
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      useForm<any>({
        initialValues: {
          users: 'test',
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
  arr.insert(0, '');
  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
});

test('array move noop when path is not an array', async () => {
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      useForm<any>({
        initialValues: {
          users: 'test',
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
  arr.move(0, 1);
  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
});

test('array swap noop when path is not an array', async () => {
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      useForm<any>({
        initialValues: {
          users: 'test',
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
  arr.swap(0, 1);
  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
});

test('array remove noop when path is not an array', async () => {
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      useForm<any>({
        initialValues: {
          users: 'test',
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
  arr.remove(0);
  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
});

test('array update noop when path is not an array', async () => {
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      useForm<any>({
        initialValues: {
          users: 'test',
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
  arr.update(0, '');
  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
});

test('array push initializes the array if undefined', async () => {
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      useForm<any>({
        initialValues: {
          users: undefined,
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
  arr.push('');
  await flushPromises();
  expect(arr.fields.value).toHaveLength(1);
});

test('array prepend initializes the array if undefined', async () => {
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      useForm<any>({
        initialValues: {
          users: undefined,
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
  arr.prepend('');
  await flushPromises();
  expect(arr.fields.value).toHaveLength(1);
});

test('array move initializes the array if undefined', async () => {
  let arr!: FieldArrayContext;
  mountWithHoc({
    setup() {
      useForm<any>({
        initialValues: {
          users: undefined,
        },
        validationSchema: yup.object({
          users: yup.array().of(yup.string().required().min(1)),
        }),
      });

      arr = useFieldArray('users');
    },
    template: `
      <div></div>
    `,
  });

  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
  arr.move(0, 0);
  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
});

// #4557
test('child sees an error for invalid value input after insert', async () => {
  const childrenErrors = new Map();
  const InputText = defineComponent({
    props: {
      name: {
        type: String,
        required: true,
      },
      debugKey: {
        type: Number,
        required: true,
      },
    },
    setup(props) {
      const { value, errors } = useField(() => props.name);
      childrenErrors.set(props.debugKey, errors);
      return {
        value,
      };
    },
    template: '<input v-model="value" />',
  });

  let form!: FormContext;
  let arr!: FieldArrayContext;
  mountWithHoc({
    components: {
      InputText,
    },
    setup() {
      form = useForm({
        initialValues: {
          emails: [],
        },
        validationSchema: yup.object({
          emails: yup.array().of(yup.string().email()),
        }),
      });

      const childName = (index: number) => `emails[${index}]`;
      arr = useFieldArray('emails');

      return {
        arr,
        childName,
      };
    },
    template: `
      <InputText v-for="(field, index) of arr.fields.value"
      :name="childName(index)" :debugKey="field.key"/>
    `,
  });

  await flushPromises();
  expect(arr.fields.value).toHaveLength(0);
  arr.insert(0, '');
  form.setFieldValue('emails.1', 'a');
  await flushPromises();
  expect(childrenErrors.get(1).value).toStrictEqual(['emails[1] must be a valid email']);
});

// #4559
test('updates initialValue correctly after useFieldArray insert', async () => {
  const childrenInitialValues = new Map();
  const InputText = defineComponent({
    props: {
      name: {
        type: String,
        required: true,
      },
      debugKey: {
        type: Number,
        required: true,
      },
    },
    setup(props) {
      const { value, meta } = useField(() => props.name);
      watch(meta, () => childrenInitialValues.set(props.debugKey, meta.initialValue));
      return {
        value,
      };
    },
    template: '<input v-model="value" />',
  });

  mountWithHoc({
    components: {
      InputText,
    },
    setup() {
      const { setFieldValue } = useForm({
        initialValues: {
          emails: ['bad-addr@', 'good@example.com'],
        },
        validationSchema: yup.object({
          emails: yup.array().of(yup.string().email()),
        }),
      });

      const childName = (index: number) => `emails[${index}]`;
      const { fields, insert } = useFieldArray('emails');
      onMounted(() => {
        insert(1, 'b');
        nextTick(() => setFieldValue('emails.2', 'a'));
      });

      return {
        childName,
        fields,
      };
    },
    template: `
      <InputText v-for="(field, index) of fields"
      :name="childName(index)" :key="field.key" :debugKey="field.key"/>
    `,
  });

  await flushPromises();
  expect([0, 1, 2].map(key => childrenInitialValues.get(key))).toStrictEqual(['bad-addr@', 'good@example.com', 'b']);
});
