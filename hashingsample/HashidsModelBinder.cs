using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace hashingsample;


public class HashidsModelBinder : IModelBinder {
    public Task BindModelAsync(ModelBindingContext bindingContext) {
        if (bindingContext == null)
            throw new ArgumentNullException(nameof(bindingContext));

        var modelName = bindingContext.ModelName;
        var valueProviderResult = bindingContext.ValueProvider.GetValue(modelName);

        if (valueProviderResult == ValueProviderResult.None)
            return Task.CompletedTask;

        bindingContext.ModelState.SetModelValue(modelName, valueProviderResult);
        var value = valueProviderResult.FirstValue;

        if (string.IsNullOrEmpty(value))
            return Task.CompletedTask;

        bindingContext.Result = ModelBindingResult.Success(CaseIdHasher.Encode(value));
        return Task.CompletedTask;
    }
}


