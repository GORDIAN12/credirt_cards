import {
  Button,
  ColorArea,
  ColorField,
  ColorPicker as AriaColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorThumb,
  Dialog,
  DialogTrigger,
  Input,
  Label,
  Popover,
  SliderTrack,
} from "react-aria-components";

export function ColorPicker({ label, children, ...props }) {
  return (
    <AriaColorPicker {...props}>
      <DialogTrigger>
        <Button className="color-picker-trigger">
          <ColorSwatch
            className="color-picker-swatch"
            style={({ color }) => ({
              background: `linear-gradient(${color}, ${color}), repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px`,
            })}
          />
          {label ? <span>{label}</span> : null}
        </Button>
        <Popover placement="bottom start" className="color-picker-popover">
          <Dialog className="color-picker-dialog">
            {children || (
              <>
                <ColorArea
                  className="color-picker-area"
                  colorSpace="hsb"
                  xChannel="saturation"
                  yChannel="brightness"
                  style={({ defaultStyle, isDisabled }) => ({
                    ...defaultStyle,
                    background: isDisabled ? undefined : defaultStyle.background,
                  })}
                >
                  <ColorThumb className="color-picker-thumb" />
                </ColorArea>
                <ColorSlider className="color-picker-slider" colorSpace="hsb" channel="hue">
                  <SliderTrack
                    className="color-picker-track"
                    style={({ defaultStyle, isDisabled }) => ({
                      ...defaultStyle,
                      background: isDisabled
                        ? undefined
                        : `${defaultStyle.background}, repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px`,
                    })}
                  >
                    <ColorThumb className="color-picker-thumb" />
                  </SliderTrack>
                </ColorSlider>
                <ColorField className="color-picker-field" label="Hex">
                  <Label>Hex</Label>
                  <Input />
                </ColorField>
              </>
            )}
          </Dialog>
        </Popover>
      </DialogTrigger>
    </AriaColorPicker>
  );
}
