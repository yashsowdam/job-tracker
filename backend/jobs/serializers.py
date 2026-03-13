from rest_framework import serializers
from .models import JobApplication

class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = [
            "id",
            "company",
            "role",
            "status",
            "applied_date",
            "link",
            "salary_min",
            "salary_max",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        salary_min = attrs.get("salary_min")
        salary_max = attrs.get("salary_max")

        # allow partial updates where one may be missing
        if salary_min is not None and salary_max is not None and salary_min > salary_max:
            raise serializers.ValidationError("salary_min cannot be greater than salary_max.")
        return attrs